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
      isAnonymous
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
      isAnonymous
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
      cons
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const updateData = {
      rating,
      title,
      content,
      pros,
      cons
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
      sortBy = 'newest'
    } = req.query;

    // This would need to be implemented in the service
    // For now, return placeholder
    res.status(200).json({
      success: true,
      message: 'User reviews retrieved successfully',
      data: {
        reviews: [],
        pagination: {
          total: 0,
          page: Number(page),
          pages: 0,
          limit: Number(limit)
        }
      }
    });
  });

  // Get review statistics for user dashboard
  static getMyReviewStats = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    // This would need to be implemented in the service
    // For now, return placeholder
    res.status(200).json({
      success: true,
      message: 'User review statistics retrieved successfully',
      data: {
        totalReviews: 0,
        averageRating: 0,
        totalUpvotes: 0,
        totalHelpful: 0,
        reviewsThisMonth: 0
      }
    });
  });
}
