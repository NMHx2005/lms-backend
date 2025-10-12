import { Response } from 'express';
import mongoose from 'mongoose';
import { courseRatingService } from '../../shared/services/rating/course-rating.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';

export class CourseRatingController {

  // Create a new review for a course
  static createReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;
    const {
      rating,
      title,
      content,
      pros,
      cons,
      isAnonymous,
      isPublic
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    const reviewData = {
      courseId,
      userId: req.user!.id,
      rating,
      title,
      content,
      pros,
      cons,
      isAnonymous,
      isPublic
    };

    const review = await courseRatingService.createReview(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  });

  // Update user's existing review
  static updateReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;
    const {
      rating,
      title,
      content,
      pros,
      cons,
      isPublic
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const updateData = {
      rating,
      title,
      content,
      pros,
      cons,
      isPublic
    };

    const review = await courseRatingService.updateReview(reviewId, req.user!.id, updateData);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  });

  // Delete user's review
  static deleteReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    await courseRatingService.deleteReview(reviewId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  });

  // Get all reviews for a course
  static getCourseReviews = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;
    const {
      rating,
      sortBy = 'quality',
      page = 1,
      limit = 20
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    const filters = {
      rating: rating ? Number(rating) : undefined,
      sortBy: sortBy as 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful' | 'quality',
      page: Number(page),
      limit: Number(limit)
    };

    const result = await courseRatingService.getCourseReviews(courseId, filters);

    res.status(200).json({
      success: true,
      message: 'Course reviews retrieved successfully',
      data: result
    });
  });

  // Get user's review for a specific course
  static getUserReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    const review = await courseRatingService.getUserReview(req.user!.id, courseId);

    res.status(200).json({
      success: true,
      message: review ? 'User review retrieved successfully' : 'No review found',
      data: review
    });
  });

  // Get course rating summary
  static getCourseSummary = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    const summary = await courseRatingService.getCourseSummary(courseId);

    res.status(200).json({
      success: true,
      message: 'Course rating summary retrieved successfully',
      data: summary
    });
  });

  // Upvote a review
  static upvoteReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await courseRatingService.upvoteReview(reviewId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Review upvoted successfully',
      data: {
        reviewId: review._id,
        upvotes: review.upvotes,
        downvotes: review.downvotes,
        voteScore: review.voteScore
      }
    });
  });

  // Downvote a review
  static downvoteReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await courseRatingService.downvoteReview(reviewId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Review downvoted successfully',
      data: {
        reviewId: review._id,
        upvotes: review.upvotes,
        downvotes: review.downvotes,
        voteScore: review.voteScore
      }
    });
  });

  // Mark review as helpful
  static markReviewHelpful = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await courseRatingService.markReviewHelpful(reviewId, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        reviewId: review._id,
        helpfulCount: review.helpfulCount,
        totalVotes: review.totalVotes,
        helpfulPercentage: review.helpfulPercentage
      }
    });
  });

  // Report a review
  static reportReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await courseRatingService.reportReview(reviewId, req.user!.id, reason);

    res.status(200).json({
      success: true,
      message: 'Review reported successfully',
      data: {
        reviewId: review._id,
        reportCount: review.reportCount,
        status: review.status
      }
    });
  });

  // Get user's own reviews across all courses
  static getMyReviews = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // Get user's reviews
    const CourseReview = (await import('../../shared/models')).CourseReview;
    const [reviews, total] = await Promise.all([
      CourseReview.find({ userId: req.user!.id })  // ✅ Đúng field
        .populate('courseId', 'title thumbnail')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      CourseReview.countDocuments({ userId: req.user!.id })  // ✅ Đúng field
    ]);

    res.status(200).json({
      success: true,
      message: 'User reviews retrieved successfully',
      data: reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    });
  });

  // Get review statistics for user dashboard
  static getMyReviewStats = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const CourseReview = (await import('../../shared/models')).CourseReview;

    // Get all user's reviews
    const reviews = await CourseReview.find({ userId: req.user!.id });  // ✅ Đúng field

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) / totalReviews
      : 0;

    const helpfulVotesReceived = reviews.reduce((sum, r: any) => sum + (r.helpfulCount || 0), 0);

    // Calculate rating distribution
    const ratingDistribution = {
      1: reviews.filter((r: any) => r.rating === 1).length,
      2: reviews.filter((r: any) => r.rating === 2).length,
      3: reviews.filter((r: any) => r.rating === 3).length,
      4: reviews.filter((r: any) => r.rating === 4).length,
      5: reviews.filter((r: any) => r.rating === 5).length,
    };

    // Count unique courses reviewed
    const coursesReviewed = new Set(reviews.map((r: any) => r.courseId.toString())).size;

    res.status(200).json({
      success: true,
      message: 'User review statistics retrieved successfully',
      data: {
        totalReviews,
        averageRating,
        ratingDistribution,
        helpfulVotesReceived,
        coursesReviewed
      }
    });
  });
}
