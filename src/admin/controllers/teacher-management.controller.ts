import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import TeacherScore from '../../shared/models/core/TeacherScore';
import TeacherRating from '../../shared/models/core/TeacherRating';
import User from '../../shared/models/core/User';
import Course from '../../shared/models/core/Course';
import TeacherAnalyticsService from '../../shared/services/analytics/teacher-analytics.service';

/**
 * Get all teachers with scores and performance metrics
 */
export const getAllTeachers = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const sortBy = req.query.sortBy as string || 'overallScore';
  const sortOrder = req.query.sortOrder as string || 'desc';
  const status = req.query.status as string;
  const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : undefined;
  const maxScore = req.query.maxScore ? parseInt(req.query.maxScore as string) : undefined;

  // Build teacher filter
  const teacherFilter: any = { roles: 'teacher' };
  if (status) teacherFilter.isActive = status === 'active';
  if (search) {
    teacherFilter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Build aggregation pipeline
  const pipeline: any[] = [
    {
      $match: teacherFilter
    },
    {
      $lookup: {
        from: 'teacherscores',
        let: { teacherId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$teacherId', '$$teacherId'] },
              status: 'active'
            }
          },
          { $sort: { generatedAt: -1 } },
          { $limit: 1 }
        ],
        as: 'latestScore'
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: 'instructorId',
        as: 'courses'
      }
    },
    {
      $addFields: {
        currentScore: { $arrayElemAt: ['$latestScore', 0] },
        coursesCount: { $size: '$courses' },
        activeCourses: {
          $size: {
            $filter: {
              input: '$courses',
              cond: { $eq: ['$$this.status', 'published'] }
            }
          }
        }
      }
    }
  ];

  // Add score filtering
  if (minScore !== undefined || maxScore !== undefined) {
    const scoreFilter: any = {};
    if (minScore !== undefined) scoreFilter.$gte = minScore;
    if (maxScore !== undefined) scoreFilter.$lte = maxScore;
    
    pipeline.push({
      $match: {
        'currentScore.overallScore': scoreFilter
      }
    });
  }

  // Add sorting
  const sortStage: any = {};
  if (sortBy === 'overallScore') {
    sortStage['currentScore.overallScore'] = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'name') {
    sortStage.firstName = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'coursesCount') {
    sortStage.coursesCount = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortStage.createdAt = -1;
  }

  pipeline.push({ $sort: sortStage });

  // Add pagination
  const skip = (page - 1) * limit;
  pipeline.push(
    { $skip: skip },
    { $limit: limit }
  );

  // Project final data
  pipeline.push({
    $project: {
      _id: 1,
      firstName: 1,
      lastName: 1,
      email: 1,
      isActive: 1,
      createdAt: 1,
      coursesCount: 1,
      activeCourses: 1,
      currentScore: {
        overallScore: '$currentScore.overallScore',
        scoreGrade: '$currentScore.scoreGrade',
        scoreChange: '$currentScore.scoreChange',
        generatedAt: '$currentScore.generatedAt',
        periodType: '$currentScore.periodType',
        ranking: '$currentScore.analytics.ranking'
      }
    }
  });

  // Execute aggregation
  const teachers = await User.aggregate(pipeline);

  // Get total count for pagination
  const totalPipeline = [...pipeline.slice(0, -3)]; // Remove sort, skip, limit, project
  totalPipeline.push({ $count: 'total' });
  const totalResult = await User.aggregate(totalPipeline);
  const total = totalResult[0]?.total || 0;

  res.json({
    success: true,
    data: teachers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get teacher detail with complete performance data
 */
export const getTeacherDetail = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { teacherId } = req.params;

  const teacher = await User.findOne({ _id: teacherId, roles: 'teacher' })
    .select('firstName lastName email isActive createdAt profile');

  if (!teacher) {
    throw new AppError('Teacher not found', 404);
  }

  // Get latest score
  const latestScore = await TeacherScore.findOne({ teacherId })
    .sort({ generatedAt: -1 });

  // Get score history
  const scoreHistory = await TeacherScore.find({ teacherId })
    .sort({ generatedAt: -1 })
    .limit(12);

  // Get courses
  const courses = await Course.find({ instructorId: teacherId })
    .select('title status enrollmentCount averageRating createdAt');

  // Get recent ratings
  const recentRatings = await TeacherRating.find({ teacherId, status: 'active' })
    .populate('studentId', 'firstName lastName')
    .populate('courseId', 'title')
    .sort({ 'ratingContext.ratingDate': -1 })
    .limit(10);

  // Calculate teacher statistics
  const stats = await TeacherRating.aggregate([
    { $match: { teacherId, status: 'active' } },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$overallRating' },
        recommendationRate: { $avg: { $cond: ['$feedback.wouldRecommend', 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      teacher,
      currentScore: latestScore,
      scoreHistory,
      courses,
      recentRatings,
      statistics: stats[0] || {
        totalRatings: 0,
        averageRating: 0,
        recommendationRate: 0
      }
    }
  });
});

/**
 * Generate teacher score manually
 */
export const generateTeacherScore = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { teacherId } = req.params;
  const { periodType = 'monthly' } = req.body;

  // Verify teacher exists
  const teacher = await User.findOne({ _id: teacherId, roles: 'teacher' });
  if (!teacher) {
    throw new AppError('Teacher not found', 404);
  }

  // Generate score
  const teacherScore = await TeacherAnalyticsService.generateTeacherScore(teacherId as any, periodType);

  // Add audit log
  teacherScore.auditLog.push({
    action: 'manual_generation',
    timestamp: new Date(),
    userId: req.user.id as any,
    details: `Score manually generated by admin ${req.user.email}`
  });

  await teacherScore.save();

  res.status(201).json({
    success: true,
    message: 'Teacher score generated successfully',
    data: teacherScore
  });
});

/**
 * Bulk generate scores for all teachers
 */
export const bulkGenerateScores = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { periodType = 'monthly', teacherIds } = req.body;

  try {
    if (teacherIds && Array.isArray(teacherIds)) {
      // Generate for specific teachers
      const results = [];
      for (const teacherId of teacherIds) {
        try {
          const score = await TeacherAnalyticsService.generateTeacherScore(teacherId, periodType);
          results.push({ teacherId, success: true, scoreId: score.scoreId });
        } catch (error) {
          results.push({ 
            teacherId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        message: 'Bulk score generation completed',
        data: results
      });
    } else {
      // Generate for all teachers
      await TeacherAnalyticsService.autoGenerateAllTeacherScores(periodType);

      res.json({
        success: true,
        message: 'Scores generated for all active teachers'
      });
    }
  } catch (error) {
    throw new AppError('Bulk generation failed', 500);
  }
});

/**
 * Get teacher performance statistics
 */
export const getTeacherStatistics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { period = 'monthly' } = req.query;

  // Overall statistics
  const overallStats = await TeacherScore.aggregate([
    {
      $match: {
        periodType: period,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        totalTeachers: { $sum: 1 },
        averageScore: { $avg: '$overallScore' },
        highPerformers: {
          $sum: { $cond: [{ $gte: ['$overallScore', 80] }, 1, 0] }
        },
        lowPerformers: {
          $sum: { $cond: [{ $lt: ['$overallScore', 60] }, 1, 0] }
        },
        totalStudentsImpacted: { $sum: '$analytics.totalStudents' },
        totalCourses: { $sum: '$analytics.coursesActive' }
      }
    }
  ]);

  // Score distribution
  const scoreDistribution = await TeacherScore.aggregate([
    {
      $match: {
        periodType: period,
        status: 'active'
      }
    },
    {
      $bucket: {
        groupBy: '$overallScore',
        boundaries: [0, 40, 60, 70, 80, 90, 101],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          averageScore: { $avg: '$overallScore' }
        }
      }
    }
  ]);

  // Grade distribution
  const gradeDistribution = await TeacherScore.aggregate([
    {
      $match: {
        periodType: period,
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$scoreGrade',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Monthly trends
  const monthlyTrends = await TeacherScore.aggregate([
    {
      $match: {
        status: 'active',
        generatedAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$generatedAt' },
          month: { $month: '$generatedAt' }
        },
        averageScore: { $avg: '$overallScore' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Top performing teachers
  const topTeachers = await TeacherScore.find({ 
    periodType: period, 
    status: 'active' 
  })
    .populate('teacherId', 'firstName lastName')
    .sort({ overallScore: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      overview: overallStats[0] || {
        totalTeachers: 0,
        averageScore: 0,
        highPerformers: 0,
        lowPerformers: 0,
        totalStudentsImpacted: 0,
        totalCourses: 0
      },
      scoreDistribution,
      gradeDistribution,
      monthlyTrends,
      topTeachers
    }
  });
});

/**
 * Get teacher leaderboard
 */
export const getTeacherLeaderboard = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const periodType = req.query.periodType as string || 'monthly';

  const leaderboard = await TeacherAnalyticsService.getTeacherLeaderboard(limit, periodType as any);

  res.json({
    success: true,
    data: leaderboard
  });
});

/**
 * Update teacher score status or review
 */
export const updateTeacherScore = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { scoreId } = req.params;
  const { status, reviewNotes, targetScore, actionPlan } = req.body;

  const teacherScore = await TeacherScore.findOne({ scoreId });
  
  if (!teacherScore) {
    throw new AppError('Teacher score not found', 404);
  }

  // Update status and review
  if (status) {
    teacherScore.status = status;
  }

  if (reviewNotes) {
    teacherScore.reviewNotes = reviewNotes;
    teacherScore.reviewedBy = req.user.id as any;
    teacherScore.reviewedAt = new Date();
  }

  if (targetScore) {
    teacherScore.goals.targetScore = targetScore;
    if (actionPlan) teacherScore.goals.actionPlan = actionPlan;
    teacherScore.goals.targetAchieved = teacherScore.overallScore >= targetScore;
  }

  // Add audit log
  teacherScore.auditLog.push({
    action: 'score_updated',
    timestamp: new Date(),
    userId: req.user.id as any,
    details: `Score updated by admin: ${Object.keys(req.body).join(', ')}`
  });

  await teacherScore.save();

  res.json({
    success: true,
    message: 'Teacher score updated successfully',
    data: teacherScore
  });
});

/**
 * Export teacher performance report
 */
export const exportTeacherReport = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { format = 'csv', periodType = 'monthly', startDate, endDate } = req.query;

  // Build filter
  const filter: any = { status: 'active' };
  if (periodType) filter.periodType = periodType;
  if (startDate || endDate) {
    filter.generatedAt = {};
    if (startDate) filter.generatedAt.$gte = new Date(startDate as string);
    if (endDate) filter.generatedAt.$lte = new Date(endDate as string);
  }

  const teacherScores = await TeacherScore.find(filter)
    .populate('teacherId', 'firstName lastName email')
    .sort({ overallScore: -1 });

  if (format === 'csv') {
    // Generate CSV
    const csvHeaders = [
      'Teacher Name',
      'Email',
      'Overall Score',
      'Grade',
      'Student Rating',
      'Course Performance',
      'Engagement',
      'Development',
      'Total Students',
      'Active Courses',
      'Period',
      'Generated Date'
    ];

    const csvRows = teacherScores.map(score => [
      `${(score.teacherId as any).firstName} ${(score.teacherId as any).lastName}`,
      (score.teacherId as any).email,
      score.overallScore,
      score.scoreGrade,
      score.metrics.studentRating.score,
      score.metrics.coursePerformance.score,
      score.metrics.engagement.score,
      score.metrics.development.score,
      score.analytics.totalStudents,
      score.analytics.coursesActive,
      `${score.periodStart.toISOString().split('T')[0]} - ${score.periodEnd.toISOString().split('T')[0]}`,
      score.generatedAt.toISOString().split('T')[0]
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=teacher-performance-report.csv');
    res.send(csvContent);
  } else {
    res.json({
      success: true,
      data: {
        teacherScores,
        summary: {
          totalTeachers: teacherScores.length,
          averageScore: teacherScores.reduce((sum, s) => sum + s.overallScore, 0) / teacherScores.length || 0,
          highPerformers: teacherScores.filter(s => s.overallScore >= 80).length,
          lowPerformers: teacherScores.filter(s => s.overallScore < 60).length
        },
        exportedAt: new Date()
      }
    });
  }
});

/**
 * Get teacher performance trends
 */
export const getTeacherTrends = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { teacherId } = req.params;
  const { months = 12 } = req.query;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months as string));

  const trends = await TeacherScore.find({
    teacherId,
    generatedAt: { $gte: startDate },
    status: 'active'
  }).sort({ generatedAt: 1 });

  // Calculate trend metrics
  const trendData = trends.map(score => ({
    date: score.generatedAt,
    overallScore: score.overallScore,
    studentRating: score.metrics.studentRating.score,
    coursePerformance: score.metrics.coursePerformance.score,
    engagement: score.metrics.engagement.score,
    development: score.metrics.development.score,
    totalStudents: score.analytics.totalStudents,
    ranking: score.analytics.ranking.overallRank
  }));

  res.json({
    success: true,
    data: {
      trends: trendData,
      summary: {
        totalDataPoints: trends.length,
        scoreImprovement: trends.length > 1 
          ? trends[trends.length - 1].overallScore - trends[0].overallScore
          : 0,
        averageScore: trends.reduce((sum, t) => sum + t.overallScore, 0) / trends.length || 0,
        bestScore: Math.max(...trends.map(t => t.overallScore)),
        worstScore: Math.min(...trends.map(t => t.overallScore))
      }
    }
  });
});
