import { Response } from 'express';
import mongoose from 'mongoose';
import { courseRatingService } from '../../shared/services/rating/course-rating.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import CourseReview from '../../shared/models/core/CourseReview';
import Course from '../../shared/models/core/Course';

export class TeacherResponseController {
  
  // Add response to a review
  static addResponse = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    if (!content || content.trim().length < 10) {
      throw new AppError('Response content must be at least 10 characters', 400);
    }

    const review = await courseRatingService.addTeacherResponse(
      reviewId,
      req.user!.id,
      content.trim()
    );

    res.status(200).json({
      success: true,
      message: 'Teacher response added successfully',
      data: {
        reviewId: review._id,
        teacherResponse: review.teacherResponse
      }
    });
  });

  // Update teacher response
  static updateResponse = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    if (!content || content.trim().length < 10) {
      throw new AppError('Response content must be at least 10 characters', 400);
    }

    const review = await CourseReview.findById(reviewId).populate('courseId');
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if teacher owns the course
    const course = await Course.findOne({
      _id: review.courseId,
      instructorId: req.user!.id
    });

    if (!course) {
      throw new AppError('Access denied: You are not the instructor of this course', 403);
    }

    // Check if teacher response exists
    if (!review.teacherResponse) {
      throw new AppError('No teacher response found to update', 404);
    }

    // Check if response belongs to this teacher
    if (review.teacherResponse.userId.toString() !== req.user!.id) {
      throw new AppError('Access denied: You can only update your own responses', 403);
    }

    // Update response
    review.teacherResponse.content = content.trim();
    review.teacherResponse.respondedAt = new Date();
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Teacher response updated successfully',
      data: {
        reviewId: review._id,
        teacherResponse: review.teacherResponse
      }
    });
  });

  // Delete teacher response
  static deleteResponse = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await CourseReview.findById(reviewId).populate('courseId');
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Check if teacher owns the course
    const course = await Course.findOne({
      _id: review.courseId,
      instructorId: req.user!.id
    });

    if (!course) {
      throw new AppError('Access denied: You are not the instructor of this course', 403);
    }

    // Check if teacher response exists
    if (!review.teacherResponse) {
      throw new AppError('No teacher response found to delete', 404);
    }

    // Check if response belongs to this teacher
    if (review.teacherResponse.userId.toString() !== req.user!.id) {
      throw new AppError('Access denied: You can only delete your own responses', 403);
    }

    // Remove response
    review.teacherResponse = undefined;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Teacher response deleted successfully'
    });
  });

  // Get reviews for teacher's courses (for responding)
  static getMyCoursesReviews = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      courseId,
      hasResponse,
      rating,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    // Build query for teacher's courses
    const courseQuery: any = { instructorId: req.user!.id };
    if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery, '_id');
    const courseIds = courses.map(c => c._id);

    // Build review query
    const reviewQuery: any = {
      courseId: { $in: courseIds },
      status: 'published'
    };

    if (rating) {
      reviewQuery.rating = Number(rating);
    }

    if (hasResponse !== undefined) {
      if (hasResponse === 'true') {
        reviewQuery.teacherResponse = { $exists: true };
      } else {
        reviewQuery.teacherResponse = { $exists: false };
      }
    }

    // Build sort
    const sortOptions: any = {};
    switch (sortBy) {
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'rating_high':
        sortOptions.rating = -1;
        break;
      case 'rating_low':
        sortOptions.rating = 1;
        break;
      case 'most_helpful':
        sortOptions.helpfulCount = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const [reviews, total] = await Promise.all([
      CourseReview.find(reviewQuery)
        .populate('userId', 'firstName lastName avatar')
        .populate('courseId', 'title')
        .populate('teacherResponse.userId', 'firstName lastName')
        .sort(sortOptions)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      CourseReview.countDocuments(reviewQuery)
    ]);

    res.status(200).json({
      success: true,
      message: 'Teacher course reviews retrieved successfully',
      data: {
        reviews,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit)
        }
      }
    });
  });

  // Get teacher's response statistics
  static getResponseStatistics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const courses = await Course.find({ instructorId: req.user!.id }, '_id');
    const courseIds = courses.map(c => c._id);

    const [
      totalReviews,
      totalResponses,
      avgResponseTime,
      responsesByRating
    ] = await Promise.all([
      CourseReview.countDocuments({
        courseId: { $in: courseIds },
        status: 'published'
      }),
      CourseReview.countDocuments({
        courseId: { $in: courseIds },
        status: 'published',
        teacherResponse: { $exists: true }
      }),
      CourseReview.aggregate([
        {
          $match: {
            courseId: { $in: courseIds },
            status: 'published',
            teacherResponse: { $exists: true }
          }
        },
        {
          $addFields: {
            responseTime: {
              $subtract: ['$teacherResponse.respondedAt', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ]),
      CourseReview.aggregate([
        {
          $match: {
            courseId: { $in: courseIds },
            status: 'published'
          }
        },
        {
          $group: {
            _id: '$rating',
            total: { $sum: 1 },
            withResponse: {
              $sum: {
                $cond: [{ $ifNull: ['$teacherResponse', false] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: -1 } }
      ])
    ]);

    const responseRate = totalReviews > 0 ? Math.round((totalResponses / totalReviews) * 100) : 0;
    const avgResponseTimeHours = avgResponseTime[0]?.avgResponseTime 
      ? Math.round(avgResponseTime[0].avgResponseTime / (1000 * 60 * 60))
      : 0;

    res.status(200).json({
      success: true,
      message: 'Teacher response statistics retrieved successfully',
      data: {
        totalReviews,
        totalResponses,
        responseRate,
        averageResponseTimeHours: avgResponseTimeHours,
        responsesByRating: responsesByRating.reduce((acc: any, item: any) => {
          acc[item._id] = {
            total: item.total,
            withResponse: item.withResponse,
            responseRate: Math.round((item.withResponse / item.total) * 100)
          };
          return acc;
        }, {})
      }
    });
  });

  // Get pending reviews (without teacher response)
  static getPendingResponses = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      courseId,
      rating,
      sortBy = 'oldest',
      page = 1,
      limit = 20
    } = req.query;

    // Build query for teacher's courses
    const courseQuery: any = { instructorId: req.user!.id };
    if (courseId && mongoose.Types.ObjectId.isValid(courseId as string)) {
      courseQuery._id = courseId;
    }

    const courses = await Course.find(courseQuery, '_id');
    const courseIds = courses.map(c => c._id);

    // Build review query for reviews without teacher response
    const reviewQuery: any = {
      courseId: { $in: courseIds },
      status: 'published',
      teacherResponse: { $exists: false }
    };

    if (rating) {
      reviewQuery.rating = Number(rating);
    }

    // Build sort (prioritize older reviews for response)
    const sortOptions: any = {};
    switch (sortBy) {
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'rating_low':
        sortOptions.rating = 1;
        sortOptions.createdAt = 1;
        break;
      case 'rating_high':
        sortOptions.rating = -1;
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = 1;
    }

    const [reviews, total] = await Promise.all([
      CourseReview.find(reviewQuery)
        .populate('userId', 'firstName lastName avatar')
        .populate('courseId', 'title')
        .sort(sortOptions)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      CourseReview.countDocuments(reviewQuery)
    ]);

    res.status(200).json({
      success: true,
      message: 'Pending responses retrieved successfully',
      data: {
        reviews,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit)
        }
      }
    });
  });
}
