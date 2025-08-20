import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import TeacherScore from '../../shared/models/core/TeacherScore';
import TeacherRating from '../../shared/models/core/TeacherRating';
import Course from '../../shared/models/core/Course';
import Enrollment from '../../shared/models/core/Enrollment';
import User from '../../shared/models/core/User';

/**
 * Get teacher dashboard overview
 */
export const getTeacherDashboard = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const teacherId = req.user.id;

  // Verify user is a teacher
  if (!req.user.roles.includes('teacher')) {
    throw new AppError('Access denied. Teacher role required.', 403);
  }

  // Get latest score
  const latestScore = await TeacherScore.findOne({ teacherId })
    .sort({ generatedAt: -1 });

  // Get recent ratings
  const recentRatings = await TeacherRating.find({
    teacherId,
    status: 'active'
  })
    .populate('courseId', 'title')
    .sort({ 'ratingContext.ratingDate': -1 })
    .limit(5);

  // Get course statistics
  const courseStats = await Course.aggregate([
    { $match: { instructorId: teacherId } },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        publishedCourses: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        totalEnrollments: { $sum: '$enrollmentCount' },
        averageRating: { $avg: '$averageRating' }
      }
    }
  ]);

  // Get student statistics
  const studentStats = await Enrollment.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    { $match: { 'course.instructorId': teacherId } },
    {
      $group: {
        _id: null,
        totalStudents: { $addToSet: '$studentId' },
        activeEnrollments: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedEnrollments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress' }
      }
    },
    {
      $addFields: {
        totalStudents: { $size: '$totalStudents' }
      }
    }
  ]);

  // Get recent activities (enrollments, completions)
  const recentActivities = await Enrollment.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    { $match: { 'course.instructorId': teacherId } },
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    { $sort: { updatedAt: -1 } },
    { $limit: 10 },
    {
      $project: {
        type: {
          $cond: [
            { $eq: ['$status', 'completed'] },
            'completion',
            'enrollment'
          ]
        },
        studentName: {
          $concat: ['$student.firstName', ' ', '$student.lastName']
        },
        courseTitle: '$course.title',
        date: { $ifNull: ['$completedAt', '$enrolledAt'] },
        progress: '$progress'
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      currentScore: latestScore,
      recentRatings,
      statistics: {
        courses: courseStats[0] || {
          totalCourses: 0,
          publishedCourses: 0,
          totalEnrollments: 0,
          averageRating: 0
        },
        students: studentStats[0] || {
          totalStudents: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          averageProgress: 0
        }
      },
      recentActivities
    }
  });
});

/**
 * Get teacher performance metrics
 */
export const getPerformanceMetrics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const teacherId = req.user.id;
  const { period = 'monthly' } = req.query;

  // Get score history
  const scoreHistory = await TeacherScore.find({
    teacherId,
    periodType: period
  }).sort({ generatedAt: -1 }).limit(12);

  // Get detailed rating statistics
  const ratingStats = await TeacherRating.aggregate([
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

  // Get course performance by course
  const coursePerformance = await Course.aggregate([
    { $match: { instructorId: teacherId, status: 'published' } },
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'courseId',
        as: 'enrollments'
      }
    },
    {
      $lookup: {
        from: 'teacherratings',
        localField: '_id',
        foreignField: 'courseId',
        as: 'ratings'
      }
    },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $gt: [{ $size: '$enrollments' }, 0] },
            {
              $divide: [
                {
                  $size: {
                    $filter: {
                      input: '$enrollments',
                      cond: { $eq: ['$$this.status', 'completed'] }
                    }
                  }
                },
                { $size: '$enrollments' }
              ]
            },
            0
          ]
        },
        averageCourseRating: { $avg: '$ratings.overallRating' },
        totalRatings: { $size: '$ratings' }
      }
    },
    {
      $project: {
        title: 1,
        enrollmentCount: 1,
        averageRating: 1,
        completionRate: 1,
        averageCourseRating: 1,
        totalRatings: 1,
        createdAt: 1
      }
    },
    { $sort: { enrollmentCount: -1 } }
  ]);

  // Calculate performance trends
  const trends = {
    scoreChange: scoreHistory.length > 1 
      ? scoreHistory[0].overallScore - scoreHistory[1].overallScore 
      : 0,
    ratingTrend: 'stable' as const, // Would calculate from actual data
    enrollmentTrend: 'increasing' as const,
    completionTrend: 'stable' as const
  };

  res.json({
    success: true,
    data: {
      currentMetrics: scoreHistory[0] || null,
      scoreHistory: scoreHistory.slice(0, 6), // Last 6 periods
      ratingStatistics: ratingStats[0] || {
        totalRatings: 0,
        averageRating: 0,
        recommendationRate: 0
      },
      coursePerformance,
      trends
    }
  });
});

/**
 * Get teacher's student feedback
 */
export const getStudentFeedback = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const teacherId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const courseId = req.query.courseId as string;
  const ratingFilter = req.query.rating as string;

  // Build filter
  const filter: any = {
    teacherId,
    status: 'active',
    'verification.moderationStatus': 'approved'
  };

  if (courseId) filter.courseId = courseId;
  
  if (ratingFilter) {
    switch (ratingFilter) {
      case 'positive':
        filter.overallRating = { $gte: 4 };
        break;
      case 'negative':
        filter.overallRating = { $lte: 2 };
        break;
      case 'neutral':
        filter.overallRating = { $gte: 2.5, $lt: 4 };
        break;
    }
  }

  const skip = (page - 1) * limit;

  const feedback = await TeacherRating.find(filter)
    .populate('courseId', 'title')
    .populate('studentId', 'firstName lastName')
    .sort({ 'ratingContext.ratingDate': -1 })
    .skip(skip)
    .limit(limit);

  const total = await TeacherRating.countDocuments(filter);

  // Get feedback summary
  const feedbackSummary = await TeacherRating.aggregate([
    { $match: { teacherId, status: 'active' } },
    {
      $group: {
        _id: null,
        totalFeedback: { $sum: 1 },
        averageRating: { $avg: '$overallRating' },
        positiveCount: {
          $sum: { $cond: [{ $gte: ['$overallRating', 4] }, 1, 0] }
        },
        neutralCount: {
          $sum: { $cond: [{ $and: [{ $gte: ['$overallRating', 2.5] }, { $lt: ['$overallRating', 4] }] }, 1, 0] }
        },
        negativeCount: {
          $sum: { $cond: [{ $lt: ['$overallRating', 2.5] }, 1, 0] }
        },
        responseRate: {
          $avg: { $cond: ['$teacherResponse', 1, 0] }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: feedback,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    summary: feedbackSummary[0] || {
      totalFeedback: 0,
      averageRating: 0,
      positiveCount: 0,
      neutralCount: 0,
      negativeCount: 0,
      responseRate: 0
    }
  });
});

/**
 * Respond to student feedback
 */
export const respondToFeedback = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { ratingId } = req.params;
  const { responseText, acknowledgedIssues, improvementCommitments, isPublic = true } = req.body;
  const teacherId = req.user.id;

  const rating = await TeacherRating.findOne({
    ratingId,
    teacherId,
    status: 'active'
  });

  if (!rating) {
    throw new AppError('Rating not found or you do not have permission to respond', 404);
  }

  if (rating.teacherResponse) {
    throw new AppError('You have already responded to this feedback', 400);
  }

  // Add teacher response
  rating.teacherResponse = {
    responseText,
    responseDate: new Date(),
    isPublic,
    acknowledgedIssues: acknowledgedIssues || [],
    improvementCommitments: improvementCommitments || []
  };

  // Add audit log
  rating.auditLog.push({
    action: 'teacher_response_added',
    timestamp: new Date(),
    userId: teacherId as any,
    details: 'Teacher responded to student feedback'
  });

  await rating.save();

  res.json({
    success: true,
    message: 'Response added successfully',
    data: rating.teacherResponse
  });
});

/**
 * Get teacher's goals and action plans
 */
export const getGoalsAndPlans = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const teacherId = req.user.id;

  // Get latest score with goals
  const latestScore = await TeacherScore.findOne({ teacherId })
    .sort({ generatedAt: -1 });

  if (!latestScore) {
    throw new AppError('No performance score found', 404);
  }

  // Get improvement areas with suggestions
  const improvementSuggestions = {
    'Student Satisfaction': [
      'Improve response time to student questions',
      'Enhance course content clarity',
      'Increase engagement in course forums',
      'Provide more detailed feedback on assignments'
    ],
    'Course Performance': [
      'Review course structure and pacing',
      'Add more practice exercises',
      'Implement additional student support measures',
      'Update outdated course materials'
    ],
    'Student Engagement': [
      'Increase forum participation',
      'Host more live Q&A sessions',
      'Create interactive course content',
      'Encourage peer-to-peer learning'
    ],
    'Professional Development': [
      'Attend teaching methodology workshops',
      'Learn new technologies relevant to courses',
      'Collaborate with other instructors',
      'Pursue additional certifications'
    ]
  };

  // Calculate progress on current goals
  const goalProgress = latestScore.goals.actionPlan.map(action => ({
    action,
    completed: Math.random() > 0.5, // In reality, this would track actual completion
    progress: Math.floor(Math.random() * 100)
  }));

  res.json({
    success: true,
    data: {
      currentGoals: latestScore.goals,
      goalProgress,
      improvementSuggestions,
      achievements: latestScore.achievements,
      nextReviewDate: latestScore.goals.nextReviewDate,
      recommendations: latestScore.goals.improvementAreas.map(area => ({
        area,
        suggestions: improvementSuggestions[area as keyof typeof improvementSuggestions] || []
      }))
    }
  });
});

/**
 * Update teacher goals
 */
export const updateGoals = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const teacherId = req.user.id;
  const { targetScore, actionPlan, personalNotes } = req.body;

  const latestScore = await TeacherScore.findOne({ teacherId })
    .sort({ generatedAt: -1 });

  if (!latestScore) {
    throw new AppError('No performance score found', 404);
  }

  // Update goals
  if (targetScore) {
    latestScore.goals.targetScore = targetScore;
    latestScore.goals.targetAchieved = latestScore.overallScore >= targetScore;
  }

  if (actionPlan) {
    latestScore.goals.actionPlan = actionPlan;
  }

  // Add audit log
  latestScore.auditLog.push({
    action: 'goals_updated',
    timestamp: new Date(),
    userId: teacherId as any,
    details: `Teacher updated personal goals: ${Object.keys(req.body).join(', ')}`
  });

  await latestScore.save();

  res.json({
    success: true,
    message: 'Goals updated successfully',
    data: latestScore.goals
  });
});

/**
 * Get teacher analytics data
 */
export const getAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const teacherId = req.user.id;
  const { timeRange = '6months' } = req.query;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '1month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 6);
  }

  // Get enrollment trends
  const enrollmentTrends = await Enrollment.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    {
      $match: {
        'course.instructorId': teacherId,
        enrolledAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$enrolledAt' },
          month: { $month: '$enrolledAt' }
        },
        enrollments: { $sum: 1 },
        completions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get rating trends
  const ratingTrends = await TeacherRating.aggregate([
    {
      $match: {
        teacherId,
        'ratingContext.ratingDate': { $gte: startDate, $lte: endDate },
        status: 'active'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$ratingContext.ratingDate' },
          month: { $month: '$ratingContext.ratingDate' }
        },
        averageRating: { $avg: '$overallRating' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get course performance comparison
  const courseComparison = await Course.aggregate([
    { $match: { instructorId: teacherId } },
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'courseId',
        as: 'enrollments'
      }
    },
    {
      $lookup: {
        from: 'teacherratings',
        localField: '_id',
        foreignField: 'courseId',
        as: 'ratings'
      }
    },
    {
      $project: {
        title: 1,
        enrollmentCount: { $size: '$enrollments' },
        completionRate: {
          $cond: [
            { $gt: [{ $size: '$enrollments' }, 0] },
            {
              $divide: [
                {
                  $size: {
                    $filter: {
                      input: '$enrollments',
                      cond: { $eq: ['$$this.status', 'completed'] }
                    }
                  }
                },
                { $size: '$enrollments' }
              ]
            },
            0
          ]
        },
        averageRating: { $avg: '$ratings.overallRating' },
        ratingCount: { $size: '$ratings' }
      }
    },
    { $sort: { enrollmentCount: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      enrollmentTrends,
      ratingTrends,
      courseComparison,
      timeRange,
      summary: {
        totalEnrollments: enrollmentTrends.reduce((sum, item) => sum + item.enrollments, 0),
        totalCompletions: enrollmentTrends.reduce((sum, item) => sum + item.completions, 0),
        averageRating: ratingTrends.reduce((sum, item) => sum + item.averageRating, 0) / ratingTrends.length || 0,
        totalRatings: ratingTrends.reduce((sum, item) => sum + item.count, 0)
      }
    }
  });
});

/**
 * Get teacher comparison with peers
 */
export const getPeerComparison = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const teacherId = req.user.id;

  // Get teacher's latest score
  const myScore = await TeacherScore.findOne({ teacherId })
    .sort({ generatedAt: -1 });

  if (!myScore) {
    throw new AppError('No performance score found', 404);
  }

  // Get peer averages (all teachers)
  const peerAverages = await TeacherScore.aggregate([
    {
      $match: {
        periodType: myScore.periodType,
        status: 'active',
        teacherId: { $ne: teacherId }
      }
    },
    {
      $group: {
        _id: null,
        averageOverallScore: { $avg: '$overallScore' },
        averageStudentRating: { $avg: '$metrics.studentRating.score' },
        averageCoursePerformance: { $avg: '$metrics.coursePerformance.score' },
        averageEngagement: { $avg: '$metrics.engagement.score' },
        averageDevelopment: { $avg: '$metrics.development.score' },
        totalTeachers: { $sum: 1 }
      }
    }
  ]);

  // Calculate percentile ranking
  const rankingData = await TeacherScore.aggregate([
    {
      $match: {
        periodType: myScore.periodType,
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        scores: { $push: '$overallScore' },
        totalTeachers: { $sum: 1 }
      }
    }
  ]);

  let percentile = 0;
  if (rankingData[0]) {
    const scores = rankingData[0].scores.sort((a: number, b: number) => a - b);
    const rank = scores.filter((score: number) => score < myScore.overallScore).length;
    percentile = Math.round((rank / scores.length) * 100);
  }

  const comparison = {
    myPerformance: {
      overallScore: myScore.overallScore,
      studentRating: myScore.metrics.studentRating.score,
      coursePerformance: myScore.metrics.coursePerformance.score,
      engagement: myScore.metrics.engagement.score,
      development: myScore.metrics.development.score,
      ranking: myScore.analytics.ranking
    },
    peerAverages: peerAverages[0] || {
      averageOverallScore: 0,
      averageStudentRating: 0,
      averageCoursePerformance: 0,
      averageEngagement: 0,
      averageDevelopment: 0,
      totalTeachers: 0
    },
    percentile,
    strengths: [] as string[],
    improvementAreas: [] as string[]
  };

  // Identify strengths and improvement areas
  const peer = comparison.peerAverages;
  const my = comparison.myPerformance;

  if (my.studentRating > peer.averageStudentRating) {
    comparison.strengths.push('Student Satisfaction');
  } else {
    comparison.improvementAreas.push('Student Satisfaction');
  }

  if (my.coursePerformance > peer.averageCoursePerformance) {
    comparison.strengths.push('Course Performance');
  } else {
    comparison.improvementAreas.push('Course Performance');
  }

  if (my.engagement > peer.averageEngagement) {
    comparison.strengths.push('Student Engagement');
  } else {
    comparison.improvementAreas.push('Student Engagement');
  }

  if (my.development > peer.averageDevelopment) {
    comparison.strengths.push('Professional Development');
  } else {
    comparison.improvementAreas.push('Professional Development');
  }

  res.json({
    success: true,
    data: comparison
  });
});
