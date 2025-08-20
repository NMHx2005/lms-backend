import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import TeacherRating, { ITeacherRating } from '../../shared/models/core/TeacherRating';
import Enrollment from '../../shared/models/core/Enrollment';
import Course from '../../shared/models/core/Course';
import User from '../../shared/models/core/User';

/**
 * Submit teacher rating by student
 */
export const submitTeacherRating = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const studentId = req.user.id;
  const {
    teacherId,
    courseId,
    ratings,
    feedback,
    courseContext
  } = req.body;

  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: { $in: ['active', 'completed'] }
  });

  if (!enrollment) {
    throw new AppError('You must be enrolled in this course to rate the teacher', 403);
  }

  // Check if already rated
  const existingRating = await TeacherRating.findOne({
    studentId,
    teacherId,
    courseId
  });

  if (existingRating) {
    throw new AppError('You have already rated this teacher for this course', 400);
  }

  // Verify course and teacher
  const course = await Course.findOne({ _id: courseId, instructorId: teacherId });
  if (!course) {
    throw new AppError('Invalid course or teacher combination', 400);
  }

  // Create teacher rating
  const teacherRating = new TeacherRating({
    studentId,
    teacherId,
    courseId,
    ratings,
    feedback,
    courseContext: {
      ...courseContext,
      enrollmentDate: enrollment.enrolledAt,
      completionDate: enrollment.completedAt,
      finalGrade: (enrollment as any).finalGrade || 0,
      courseProgress: enrollment.progress
    },
    ratingContext: {
      ratingDate: new Date(),
      ratingReason: (enrollment as any).status === 'completed' ? 'course_completion' : 'mid_course',
      timeSpentInCourse: enrollment.totalTimeSpent || 0,
      interactionFrequency: 'medium', // This would be calculated from actual interaction data
      supportReceived: true // This would be determined from support ticket history
    },
    verification: {
      isVerified: true,
      verificationMethod: 'enrollment_check',
      isAnonymous: req.body.isAnonymous || false,
      qualityScore: 85, // Would be calculated by content analysis
      moderationStatus: 'approved'
    }
  });

  // Add audit log
  teacherRating.auditLog.push({
    action: 'rating_submitted',
    timestamp: new Date(),
    userId: studentId as any,
    details: `Rating submitted for teacher ${teacherId} in course ${courseId}`,
    ipAddress: req.ip
  });

  await teacherRating.save();

  res.status(201).json({
    success: true,
    message: 'Teacher rating submitted successfully',
    data: teacherRating
  });
});

/**
 * Update existing teacher rating
 */
export const updateTeacherRating = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { ratingId } = req.params;
  const studentId = req.user.id;
  const { ratings, feedback } = req.body;

  const teacherRating = await TeacherRating.findOne({
    ratingId,
    studentId
  });

  if (!teacherRating) {
    throw new AppError('Rating not found or you do not have permission to update it', 404);
  }

  // Check if rating is still editable (within 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (teacherRating.ratingContext.ratingDate < thirtyDaysAgo) {
    throw new AppError('Rating can only be updated within 30 days of submission', 400);
  }

  // Store previous values for audit
  const previousValues = {
    ratings: teacherRating.ratings,
    feedback: teacherRating.feedback
  };

  // Update rating
  if (ratings) teacherRating.ratings = ratings;
  if (feedback) teacherRating.feedback = feedback;

  // Add audit log
  teacherRating.auditLog.push({
    action: 'rating_updated',
    timestamp: new Date(),
    userId: studentId as any,
    details: 'Rating updated by student',
    ipAddress: req.ip
  });

  await teacherRating.save();

  res.json({
    success: true,
    message: 'Teacher rating updated successfully',
    data: teacherRating
  });
});

/**
 * Get student's teacher ratings
 */
export const getMyTeacherRatings = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const studentId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const skip = (page - 1) * limit;

  const ratings = await TeacherRating.find({ studentId })
    .populate('teacherId', 'firstName lastName')
    .populate('courseId', 'title thumbnail')
    .sort({ 'ratingContext.ratingDate': -1 })
    .skip(skip)
    .limit(limit);

  const total = await TeacherRating.countDocuments({ studentId });

  res.json({
    success: true,
    data: ratings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get teacher ratings for a specific course (public view)
 */
export const getCourseTeacherRatings = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { courseId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = req.query.sortBy as string || 'date';
  const filterBy = req.query.filterBy as string;

  // Build filter
  const filter: any = {
    courseId,
    status: 'active',
    visibility: 'public',
    'verification.moderationStatus': 'approved'
  };

  if (filterBy) {
    switch (filterBy) {
      case 'high_rating':
        filter.overallRating = { $gte: 4 };
        break;
      case 'low_rating':
        filter.overallRating = { $lte: 2 };
        break;
      case 'recent':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filter['ratingContext.ratingDate'] = { $gte: oneMonthAgo };
        break;
      case 'helpful':
        filter['helpfulness.helpfulnessRatio'] = { $gte: 0.7 };
        filter['helpfulness.totalVotes'] = { $gte: 3 };
        break;
    }
  }

  // Build sort
  let sort: any = {};
  switch (sortBy) {
    case 'rating':
      sort = { overallRating: -1 };
      break;
    case 'helpful':
      sort = { 'helpfulness.helpfulnessRatio': -1 };
      break;
    case 'date':
    default:
      sort = { 'ratingContext.ratingDate': -1 };
      break;
  }

  const skip = (page - 1) * limit;

  const ratings = await TeacherRating.find(filter)
    .populate('studentId', 'firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await TeacherRating.countDocuments(filter);

  // Calculate summary statistics
  const stats = await TeacherRating.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$overallRating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: '$overallRating'
        }
      }
    }
  ]);

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: stats[0]?.ratingDistribution.filter((r: number) => Math.floor(r) === rating).length || 0
  }));

  res.json({
    success: true,
    data: ratings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    summary: {
      averageRating: stats[0]?.averageRating || 0,
      totalRatings: stats[0]?.totalRatings || 0,
      ratingDistribution
    }
  });
});

/**
 * Vote on rating helpfulness
 */
export const voteOnRating = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { ratingId } = req.params;
  const { isHelpful } = req.body;
  const userId = req.user.id;

  const rating = await TeacherRating.findOne({ ratingId, status: 'active' });
  
  if (!rating) {
    throw new AppError('Rating not found', 404);
  }

  // Check if user already voted (would need a separate votes collection in production)
  // For now, just add the vote
  if (isHelpful) {
    rating.helpfulness.helpfulVotes += 1;
  } else {
    rating.helpfulness.notHelpfulVotes += 1;
  }
  
  rating.helpfulness.totalVotes += 1;
  rating.helpfulness.helpfulnessRatio = rating.helpfulness.helpfulVotes / rating.helpfulness.totalVotes;

  // Add audit log
  rating.auditLog.push({
    action: isHelpful ? 'voted_helpful' : 'voted_not_helpful',
    timestamp: new Date(),
    userId: userId as any,
    details: `User voted ${isHelpful ? 'helpful' : 'not helpful'}`,
    ipAddress: req.ip
  });

  await rating.save();

  res.json({
    success: true,
    message: 'Vote recorded successfully',
    data: {
      helpfulVotes: rating.helpfulness.helpfulVotes,
      notHelpfulVotes: rating.helpfulness.notHelpfulVotes,
      totalVotes: rating.helpfulness.totalVotes,
      helpfulnessRatio: rating.helpfulness.helpfulnessRatio
    }
  });
});

/**
 * Report inappropriate rating
 */
export const reportRating = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { ratingId } = req.params;
  const { reason, details } = req.body;
  const userId = req.user.id;

  const rating = await TeacherRating.findOne({ ratingId, status: 'active' });
  
  if (!rating) {
    throw new AppError('Rating not found', 404);
  }

  // Flag rating for review
  rating.verification.flaggedAsInappropriate = true;
  rating.verification.moderationStatus = 'flagged';
  rating.analytics.reportCount += 1;

  // Add detailed report info
  rating.auditLog.push({
    action: 'reported_inappropriate',
    timestamp: new Date(),
    userId: userId as any,
    details: `Reported for: ${reason}. Details: ${details}`,
    ipAddress: req.ip
  });

  await rating.save();

  res.json({
    success: true,
    message: 'Rating reported successfully and flagged for review'
  });
});

/**
 * Get teacher rating statistics
 */
export const getTeacherRatingStats = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { teacherId } = req.params;

  const stats = await TeacherRating.aggregate([
    { $match: { teacherId, status: 'active', 'verification.moderationStatus': 'approved' } },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$overallRating' },
        recommendationRate: { $avg: { $cond: ['$feedback.wouldRecommend', 1, 0] } }
      }
    }
  ]);

  // Get rating distribution
  const ratingDistribution = await TeacherRating.aggregate([
    {
      $match: {
        teacherId,
        status: 'active',
        'verification.moderationStatus': 'approved'
      }
    },
    {
      $group: {
        _id: { $floor: '$overallRating' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get recent trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrends = await TeacherRating.aggregate([
    {
      $match: {
        teacherId,
        status: 'active',
        'ratingContext.ratingDate': { $gte: sixMonthsAgo }
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

  res.json({
    success: true,
    data: {
      overall: stats[0] || {
        totalRatings: 0,
        averageRating: 0,
        recommendationRate: 0
      },
      ratingDistribution,
      monthlyTrends
    }
  });
});

/**
 * Get courses available for rating by student
 */
export const getCoursesForRating = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const studentId = req.user.id;

  // Get completed enrollments where student hasn't rated the teacher yet
  const availableCourses = await Enrollment.aggregate([
    {
      $match: {
        studentId,
        status: { $in: ['completed', 'active'] },
        progress: { $gte: 50 } // At least 50% complete to rate
      }
    },
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
      $lookup: {
        from: 'users',
        localField: 'course.instructorId',
        foreignField: '_id',
        as: 'teacher'
      }
    },
    { $unwind: '$teacher' },
    {
      $lookup: {
        from: 'teacherratings',
        let: {
          studentId: '$studentId',
          teacherId: '$course.instructorId',
          courseId: '$courseId'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$studentId', '$$studentId'] },
                  { $eq: ['$teacherId', '$$teacherId'] },
                  { $eq: ['$courseId', '$$courseId'] }
                ]
              }
            }
          }
        ],
        as: 'existingRating'
      }
    },
    {
      $match: {
        existingRating: { $size: 0 } // No existing rating
      }
    },
    {
      $project: {
        courseId: '$course._id',
        courseTitle: '$course.title',
        courseThumbnail: '$course.thumbnail',
        teacherId: '$teacher._id',
        teacherName: {
          $concat: ['$teacher.firstName', ' ', '$teacher.lastName']
        },
        enrollmentDate: '$enrolledAt',
        completionDate: '$completedAt',
        finalGrade: '$finalGrade',
        progress: '$progress',
        canRate: true
      }
    }
  ]);

  res.json({
    success: true,
    data: availableCourses
  });
});

/**
 * Get rating form data for a specific course
 */
export const getRatingFormData = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: { $in: ['active', 'completed'] }
  }).populate('courseId', 'title instructorId');

  if (!enrollment) {
    throw new AppError('You are not enrolled in this course', 403);
  }

  // Get teacher info
  const teacher = await User.findById((enrollment.courseId as any).instructorId)
    .select('firstName lastName');

  // Check if already rated
  const existingRating = await TeacherRating.findOne({
    studentId,
    teacherId: (enrollment.courseId as any).instructorId,
    courseId
  });

  res.json({
    success: true,
    data: {
      course: enrollment.courseId,
      teacher,
      enrollment: {
        enrolledDate: enrollment.enrolledAt,
        progress: enrollment.progress,
        finalGrade: (enrollment as any).finalGrade || 0,
        status: (enrollment as any).status
      },
      existingRating,
      canRate: !existingRating && enrollment.progress >= 50
    }
  });
});
