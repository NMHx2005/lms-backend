import { Response } from 'express';
import mongoose from 'mongoose';
import { reviewModerationService } from '../../shared/services/rating/review-moderation.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';

export class ReviewModerationController {
  
  // Get reviews needing moderation
  static getReviewsNeedingModeration = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      status,
      reportCount,
      courseId,
      page = 1,
      limit = 20,
      sortBy = 'most_reported'
    } = req.query;

    const filters = {
      status: status as string,
      reportCount: reportCount ? Number(reportCount) : undefined,
      courseId: courseId as string,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as 'newest' | 'most_reported' | 'quality_score'
    };

    const result = await reviewModerationService.getReviewsNeedingModeration(filters);

    res.status(200).json({
      success: true,
      message: 'Reviews needing moderation retrieved successfully',
      data: result
    });
  });

  // Get detailed review for moderation
  static getReviewForModeration = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await reviewModerationService.getReviewForModeration(reviewId);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Review details retrieved successfully',
      data: review
    });
  });

  // Moderate a single review
  static moderateReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;
    const { action, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    if (!['approved', 'hidden', 'deleted'].includes(action)) {
      throw new AppError('Invalid moderation action', 400);
    }

    const moderationData = {
      action,
      reason,
      adminId: req.user!.id,
      adminName: `${req.user!.firstName} ${req.user!.lastName}`
    };

    const review = await reviewModerationService.moderateReview(reviewId, moderationData);

    res.status(200).json({
      success: true,
      message: `Review ${action} successfully`,
      data: review
    });
  });

  // Bulk moderate multiple reviews
  static bulkModerateReviews = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewIds, action, reason } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      throw new AppError('Review IDs array is required', 400);
    }

    if (!['approved', 'hidden', 'deleted'].includes(action)) {
      throw new AppError('Invalid moderation action', 400);
    }

    const moderationData = {
      action,
      reason,
      adminId: req.user!.id,
      adminName: `${req.user!.firstName} ${req.user!.lastName}`
    };

    const result = await reviewModerationService.bulkModerateReviews(reviewIds, moderationData);

    res.status(200).json({
      success: true,
      message: `Bulk moderation completed: ${result.success} successful, ${result.failed} failed`,
      data: result
    });
  });

  // Feature/unfeature a review
  static featureReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;
    const { featured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await reviewModerationService.featureReview(
      reviewId,
      req.user!.id,
      Boolean(featured)
    );

    res.status(200).json({
      success: true,
      message: `Review ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        reviewId: review._id,
        isFeatured: review.isFeatured,
        isHighlighted: review.isHighlighted
      }
    });
  });

  // Highlight/unhighlight a review
  static highlightReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { reviewId } = req.params;
    const { highlighted } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new AppError('Invalid review ID', 400);
    }

    const review = await reviewModerationService.highlightReview(
      reviewId,
      req.user!.id,
      Boolean(highlighted)
    );

    res.status(200).json({
      success: true,
      message: `Review ${highlighted ? 'highlighted' : 'unhighlighted'} successfully`,
      data: {
        reviewId: review._id,
        isHighlighted: review.isHighlighted
      }
    });
  });

  // Get moderation statistics
  static getModerationStatistics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const stats = await reviewModerationService.getModerationStats();

    res.status(200).json({
      success: true,
      message: 'Moderation statistics retrieved successfully',
      data: stats
    });
  });

  // Get moderation history
  static getModerationHistory = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      adminId,
      action,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      adminId: adminId as string,
      action: action as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      page: Number(page),
      limit: Number(limit)
    };

    const result = await reviewModerationService.getModerationHistory(filters);

    res.status(200).json({
      success: true,
      message: 'Moderation history retrieved successfully',
      data: result
    });
  });

  // Get reviews by course for admin
  static getCourseReviewsForAdmin = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;
    const {
      status = 'all',
      rating,
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    // This would need additional service method to get all reviews (including hidden/deleted) for admin
    // For now, return placeholder
    res.status(200).json({
      success: true,
      message: 'Course reviews for admin retrieved successfully',
      data: {
        reviews: [],
        pagination: {
          total: 0,
          page: Number(page),
          pages: 0,
          limit: Number(limit)
        },
        summary: {
          published: 0,
          hidden: 0,
          deleted: 0,
          pending: 0,
          totalReports: 0
        }
      }
    });
  });

  // Export moderation data
  static exportModerationData = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      dateFrom,
      dateTo,
      status,
      action,
      format = 'csv'
    } = req.query;

    // Placeholder for export functionality
    res.status(200).json({
      success: true,
      message: 'Moderation data export initiated',
      data: {
        downloadUrl: `/api/admin/reviews/export/moderation_${Date.now()}.${format}`,
        format,
        generatedAt: new Date().toISOString(),
        estimatedRecords: 0
      }
    });
  });

  // Get review engagement analytics
  static getReviewEngagementAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      dateFrom,
      dateTo,
      courseId
    } = req.query;

    // Placeholder for engagement analytics
    res.status(200).json({
      success: true,
      message: 'Review engagement analytics retrieved successfully',
      data: {
        period: {
          from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: dateTo || new Date().toISOString()
        },
        totalReviews: 0,
        totalVotes: 0,
        totalReports: 0,
        avgRating: 0,
        avgQualityScore: 0,
        engagementTrends: [],
        topCourses: [],
        moderationWorkload: {
          pending: 0,
          processed: 0,
          avgProcessingTime: 0
        }
      }
    });
  });
}
