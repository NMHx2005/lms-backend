import mongoose from 'mongoose';
import CourseReview, { ICourseReview } from '../../models/core/CourseReview';
import Course from '../../models/core/Course';
import User from '../../models/core/User';
import { emailNotificationService } from '../email/email-notification.service';
import { webSocketService } from '../websocket/websocket.service';

export interface ModerationData {
  action: 'approved' | 'hidden' | 'deleted';
  reason?: string;
  adminId: string;
  adminName: string;
}

export interface ModerationFilters {
  status?: string;
  reportCount?: number;
  courseId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'most_reported' | 'quality_score';
}

export class ReviewModerationService {
  private static instance: ReviewModerationService;

  static getInstance(): ReviewModerationService {
    if (!ReviewModerationService.instance) {
      ReviewModerationService.instance = new ReviewModerationService();
    }
    return ReviewModerationService.instance;
  }

  // Get reviews needing moderation
  async getReviewsNeedingModeration(filters: ModerationFilters = {}): Promise<{
    reviews: ICourseReview[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
    stats: {
      pending: number;
      highReports: number;
      totalReported: number;
    };
  }> {
    try {
      const {
        status,
        reportCount,
        courseId,
        page = 1,
        limit = 20,
        sortBy = 'most_reported'
      } = filters;

      // Build query for reviews needing attention
      const query: any = {
        $or: [
          { status: 'pending' },
          { reportCount: { $gte: 3 } },
          { status: 'published', reportCount: { $gte: 1 } }
        ]
      };

      if (status) query.status = status;
      if (reportCount) query.reportCount = { $gte: reportCount };
      if (courseId) query.courseId = courseId;

      // Build sort
      const sortOptions: any = {};
      switch (sortBy) {
        case 'newest':
          sortOptions.createdAt = -1;
          break;
        case 'quality_score':
          sortOptions.qualityScore = 1; // Low quality first
          break;
        case 'most_reported':
        default:
          sortOptions.reportCount = -1;
          sortOptions.createdAt = 1; // Oldest first within same report count
          break;
      }

      const [reviews, total] = await Promise.all([
        CourseReview.find(query)
          .populate('userId', 'firstName lastName email avatar')
          .populate('courseId', 'title instructorId')
          .populate('moderatedBy.adminId', 'firstName lastName')
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit),
        CourseReview.countDocuments(query)
      ]);

      // Get moderation stats
      const stats = await this.getModerationStats();

      return {
        reviews,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        },
        stats
      };

    } catch (error) {

      throw error;
    }
  }

  // Moderate a review
  async moderateReview(reviewId: string, moderationData: ModerationData): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId)
        .populate('userId', 'firstName lastName email')
        .populate('courseId', 'title');

      if (!review) {
        throw new Error('Review not found');
      }

      const previousStatus = review.status;

      // Update review with moderation action
      review.status = moderationData.action === 'approved' ? 'published' : moderationData.action;
      review.moderatedBy = {
        adminId: new mongoose.Types.ObjectId(moderationData.adminId),
        action: moderationData.action,
        reason: moderationData.reason,
        moderatedAt: new Date()
      };

      await review.save();

      // Update course rating if status changed significantly
      if (previousStatus !== review.status) {
        await this.updateCourseRatingAfterModeration(review.courseId.toString());
      }

      // Send notifications
      await this.notifyModerationAction(review, moderationData);

      return review;

    } catch (error) {

      throw error;
    }
  }

  // Bulk moderate reviews
  async bulkModerateReviews(reviewIds: string[], moderationData: ModerationData): Promise<{
    success: number;
    failed: number;
    results: { id: string; status: 'success' | 'error'; error?: string }[];
  }> {
    try {
      const results = [];
      let successCount = 0;
      let failedCount = 0;

      for (const reviewId of reviewIds) {
        try {
          await this.moderateReview(reviewId, moderationData);
          results.push({ id: reviewId, status: 'success' as const });
          successCount++;
        } catch (error: any) {
          results.push({ id: reviewId, status: 'error' as const, error: error.message });
          failedCount++;
        }
      }

      return {
        success: successCount,
        failed: failedCount,
        results
      };

    } catch (error) {

      throw error;
    }
  }

  // Feature/highlight a review
  async featureReview(reviewId: string, adminId: string, featured: boolean): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      review.isFeatured = featured;
      if (featured) {
        review.isHighlighted = true; // Featured reviews are also highlighted
      }

      await review.save();

      return review;

    } catch (error) {

      throw error;
    }
  }

  // Highlight/unhighlight a review
  async highlightReview(reviewId: string, adminId: string, highlighted: boolean): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      review.isHighlighted = highlighted;
      await review.save();

      return review;

    } catch (error) {

      throw error;
    }
  }

  // Get moderation statistics
  async getModerationStats(): Promise<{
    pending: number;
    highReports: number;
    totalReported: number;
    totalReviews: number;
    averageQualityScore: number;
  }> {
    try {
      const [
        pending,
        highReports,
        totalReported,
        totalReviews,
        qualityScore
      ] = await Promise.all([
        CourseReview.countDocuments({ status: 'pending' }),
        CourseReview.countDocuments({ reportCount: { $gte: 3 } }),
        CourseReview.countDocuments({ reportCount: { $gte: 1 } }),
        CourseReview.countDocuments({ status: { $ne: 'deleted' } }),
        CourseReview.aggregate([
          { $match: { status: { $ne: 'deleted' } } },
          { $group: { _id: null, avgScore: { $avg: '$qualityScore' } } }
        ])
      ]);

      return {
        pending,
        highReports,
        totalReported,
        totalReviews,
        averageQualityScore: qualityScore[0]?.avgScore || 0
      };

    } catch (error) {

      throw error;
    }
  }

  // Get review details for moderation
  async getReviewForModeration(reviewId: string): Promise<ICourseReview | null> {
    try {
      return await CourseReview.findById(reviewId)
        .populate('userId', 'firstName lastName email avatar createdAt')
        .populate('courseId', 'title description instructorId')
        .populate('enrollmentId', 'enrolledAt progress completedAt')
        .populate('reportedBy', 'firstName lastName email')
        .populate('moderatedBy.adminId', 'firstName lastName');

    } catch (error) {

      throw error;
    }
  }

  // Get moderation history
  async getModerationHistory(filters: {
    adminId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    history: ICourseReview[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  }> {
    try {
      const {
        adminId,
        action,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20
      } = filters;

      const query: any = {
        'moderatedBy.adminId': { $exists: true }
      };

      if (adminId) query['moderatedBy.adminId'] = adminId;
      if (action) query['moderatedBy.action'] = action;
      if (dateFrom || dateTo) {
        query['moderatedBy.moderatedAt'] = {};
        if (dateFrom) query['moderatedBy.moderatedAt'].$gte = dateFrom;
        if (dateTo) query['moderatedBy.moderatedAt'].$lte = dateTo;
      }

      const [history, total] = await Promise.all([
        CourseReview.find(query)
          .populate('userId', 'firstName lastName')
          .populate('courseId', 'title')
          .populate('moderatedBy.adminId', 'firstName lastName')
          .sort({ 'moderatedBy.moderatedAt': -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        CourseReview.countDocuments(query)
      ]);

      return {
        history,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      };

    } catch (error) {

      throw error;
    }
  }

  // Private helper methods
  private async updateCourseRatingAfterModeration(courseId: string): Promise<void> {
    try {
      // Recalculate course rating using only published reviews
      const result = await CourseReview.aggregate([
        { $match: { courseId: new mongoose.Types.ObjectId(courseId), status: 'published' } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]);

      const averageRating = result[0]?.averageRating || 0;
      const totalRatings = result[0]?.totalRatings || 0;

      await Course.findByIdAndUpdate(courseId, {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings
      });

      console.log(`✅ Course ${courseId} rating updated after moderation: ${averageRating} (${totalRatings} reviews)`);

    } catch (error) {

    }
  }

  private async notifyModerationAction(review: ICourseReview, moderationData: ModerationData): Promise<void> {
    try {
      const user = review.userId as any;
      const course = review.courseId as any;

      if (!user || !course) return;

      let title = '';
      let message = '';
      let type: 'success' | 'warning' | 'error' = 'success';

      switch (moderationData.action) {
        case 'approved':
          title = 'Review Approved';
          message = `Your review for "${course.title}" has been approved and is now visible to other students.`;
          type = 'success';
          break;
        case 'hidden':
          title = 'Review Hidden';
          message = `Your review for "${course.title}" has been temporarily hidden pending review.`;
          type = 'warning';
          break;
        case 'deleted':
          title = 'Review Removed';
          message = `Your review for "${course.title}" has been removed for violating community guidelines.`;
          type = 'error';
          break;
      }

      // WebSocket notification
      webSocketService.sendToUser(user._id.toString(), {
        type,
        title,
        message,
        actionUrl: `/student/courses/${course._id}/reviews`,
        priority: 'normal'
      });

      // Email notification for significant actions
      if (moderationData.action !== 'approved') {
        await emailNotificationService.sendEmail({
          to: user.email,
          subject: `📋 Review Update: ${course.title}`,
          html: `
            <h2>${title}</h2>
            <p>Dear ${user.firstName},</p>
            <p>${message}</p>
            ${moderationData.reason ? `<p><strong>Reason:</strong> ${moderationData.reason}</p>` : ''}
            <p>If you have questions about this decision, please contact our support team.</p>
            <p>Best regards,<br>The LMS Team</p>
          `,
          type: 'course_update',
          userId: user._id,
          courseId: course._id
        });
      }

    } catch (error) {

    }
  }
}

export const reviewModerationService = ReviewModerationService.getInstance();
