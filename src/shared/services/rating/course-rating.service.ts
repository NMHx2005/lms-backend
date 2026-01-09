import mongoose from 'mongoose';
import CourseReview, { ICourseReview } from '../../models/core/CourseReview';
import Course from '../../models/core/Course';
import Enrollment from '../../models/core/Enrollment';
import { emailNotificationService } from '../email/email-notification.service';
import { webSocketService } from '../websocket/websocket.service';
import User from '../../models/core/User';

export interface CreateReviewData {
  courseId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  isAnonymous?: boolean;
  isPublic?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  content?: string;
  pros?: string[];
  cons?: string[];
  isPublic?: boolean;
}

export interface ReviewFilters {
  rating?: number;
  status?: string;
  sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful' | 'quality';
  page?: number;
  limit?: number;
}

export class CourseRatingService {
  private static instance: CourseRatingService;

  static getInstance(): CourseRatingService {
    if (!CourseRatingService.instance) {
      CourseRatingService.instance = new CourseRatingService();
    }
    return CourseRatingService.instance;
  }

  // Create a new review
  async createReview(data: CreateReviewData): Promise<ICourseReview> {
    try {
      // Check if user is enrolled in the course
      const enrollment = await Enrollment.findOne({
        studentId: data.userId,  // ✅ Field là studentId, không phải userId
        courseId: data.courseId,
        isActive: true           // ✅ Field là isActive, không phải status
      });

      if (!enrollment) {
        throw new Error('You must be enrolled in this course to leave a review');
      }

      // Check if user already reviewed this course
      const existingReview = await CourseReview.findOne({
        userId: data.userId,
        courseId: data.courseId
      });

      if (existingReview) {
        throw new Error('You have already reviewed this course');
      }

      // Get course completion data
      const completionData = await this.getCourseCompletionData(data.userId, data.courseId);

      // Create review
      const review = new CourseReview({
        courseId: new mongoose.Types.ObjectId(data.courseId),
        userId: new mongoose.Types.ObjectId(data.userId),
        enrollmentId: enrollment._id,
        rating: data.rating,
        title: data.title,
        content: data.content,
        pros: data.pros || [],
        cons: data.cons || [],
        isAnonymous: data.isAnonymous || false,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        isVerifiedPurchase: true, // Since they're enrolled
        completionPercentage: completionData.completionPercentage,
        completedAt: completionData.completedAt,
        timeSpentInCourse: completionData.timeSpent
      });

      await review.save();

      // Update course rating
      await this.updateCourseRating(data.courseId);

      // Send notifications
      await this.notifyNewReview(review);

      return review;

    } catch (error) {

      throw error;
    }
  }

  // Update existing review
  async updateReview(reviewId: string, userId: string, data: UpdateReviewData): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findOne({
        _id: reviewId,
        userId
      });

      if (!review) {
        throw new Error('Review not found or access denied');
      }

      if (!review.isEditable) {
        throw new Error('Review can only be edited within 24 hours of creation');
      }

      // Update fields
      if (data.rating !== undefined) review.rating = data.rating;
      if (data.title !== undefined) review.title = data.title;
      if (data.content !== undefined) review.content = data.content;
      if (data.pros !== undefined) review.pros = data.pros;
      if (data.cons !== undefined) review.cons = data.cons;
      if (data.isPublic !== undefined) review.isPublic = data.isPublic;

      await review.save();

      // Update course rating
      await this.updateCourseRating(review.courseId.toString());

      return review;

    } catch (error) {

      throw error;
    }
  }

  // Delete review
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const review = await CourseReview.findOne({
        _id: reviewId,
        userId
      });

      if (!review) {
        throw new Error('Review not found or access denied');
      }

      // Soft delete
      review.status = 'deleted';
      await review.save();

      // Update course rating
      await this.updateCourseRating(review.courseId.toString());

    } catch (error) {

      throw error;
    }
  }

  // Get course reviews with filtering
  async getCourseReviews(courseId: string, filters: ReviewFilters = {}): Promise<{
    reviews: ICourseReview[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
    summary: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: { [key: number]: number };
    };
  }> {
    try {
      const {
        rating,
        status = 'published',
        sortBy = 'quality',
        page = 1,
        limit = 20
      } = filters;

      // Build query
      const query: any = { courseId, status };
      if (rating) query.rating = rating;

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
        case 'helpful':
          sortOptions.helpfulCount = -1;
          break;
        case 'quality':
        default:
          sortOptions.qualityScore = -1;
          break;
      }

      // Get reviews with pagination
      const [reviews, total] = await Promise.all([
        CourseReview.find(query)
          .populate('userId', 'firstName lastName avatar')
          .populate('teacherResponse.userId', 'firstName lastName')
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(limit),
        CourseReview.countDocuments(query)
      ]);

      // Get summary data
      const summary = await this.getCourseSummary(courseId);

      return {
        reviews,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        },
        summary
      };

    } catch (error) {

      throw error;
    }
  }

  // Get user's review for a course
  async getUserReview(userId: string, courseId: string): Promise<ICourseReview | null> {
    try {
      return await CourseReview.findOne({
        userId,
        courseId,
        status: { $ne: 'deleted' }
      }).populate('courseId', 'title');
    } catch (error) {

      throw error;
    }
  }

  // Upvote a review
  async upvoteReview(reviewId: string, userId: string): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      await review.upvote(new mongoose.Types.ObjectId(userId));
      return review;
    } catch (error) {

      throw error;
    }
  }

  // Downvote a review
  async downvoteReview(reviewId: string, userId: string): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      await review.downvote(new mongoose.Types.ObjectId(userId));
      return review;
    } catch (error) {

      throw error;
    }
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId: string, userId: string): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      await review.markHelpful(new mongoose.Types.ObjectId(userId));
      return review;
    } catch (error) {

      throw error;
    }
  }

  // Report a review
  async reportReview(reviewId: string, userId: string, reason?: string): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      await review.report(new mongoose.Types.ObjectId(userId));

      // Notify admins if review needs moderation
      if (review.reportCount >= 3) {
        await this.notifyModerationNeeded(review, reason);
      }

      return review;
    } catch (error) {

      throw error;
    }
  }

  // Add teacher response to review
  async addTeacherResponse(reviewId: string, teacherId: string, content: string): Promise<ICourseReview> {
    try {
      const review = await CourseReview.findById(reviewId).populate('courseId');
      if (!review) {
        throw new Error('Review not found');
      }

      // Check if teacher owns the course
      const course = await Course.findOne({
        _id: review.courseId,
        instructorId: teacherId
      });

      if (!course) {
        throw new Error('Access denied: You are not the instructor of this course');
      }

      review.teacherResponse = {
        userId: new mongoose.Types.ObjectId(teacherId),
        content,
        respondedAt: new Date()
      };

      await review.save();

      // Notify the reviewer
      await this.notifyTeacherResponse(review);

      return review;

    } catch (error) {

      throw error;
    }
  }

  // Get course summary (ratings, distribution)
  async getCourseSummary(courseId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    try {
      const [avgResult, distribution] = await Promise.all([
        CourseReview.aggregate([
          { $match: { courseId: new mongoose.Types.ObjectId(courseId), status: 'published' } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ]),
        CourseReview.aggregate([
          { $match: { courseId: new mongoose.Types.ObjectId(courseId), status: 'published' } },
          {
            $group: {
              _id: '$rating',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: -1 } }
        ])
      ]);

      const averageRating = avgResult[0]?.averageRating || 0;
      const totalReviews = avgResult[0]?.totalReviews || 0;

      // Build rating distribution
      const ratingDistribution: { [key: number]: number } = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      distribution.forEach((item: any) => {
        ratingDistribution[item._id] = item.count;
      });

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        ratingDistribution
      };
    } catch (error) {

      throw error;
    }
  }

  // Update course rating in Course model
  private async updateCourseRating(courseId: string): Promise<void> {
    try {
      const summary = await this.getCourseSummary(courseId);

      await Course.findByIdAndUpdate(courseId, {
        averageRating: summary.averageRating,
        totalRatings: summary.totalReviews
      });

      console.log(`✅ Course ${courseId} rating updated: ${summary.averageRating} (${summary.totalReviews} reviews)`);
    } catch (error) {

    }
  }

  // Get course completion data for review context
  private async getCourseCompletionData(userId: string, courseId: string): Promise<{
    completionPercentage: number;
    completedAt?: Date;
    timeSpent: number;
  }> {
    try {
      const enrollment = await Enrollment.findOne({
        studentId: userId,  // ✅ Field là studentId, không phải userId
        courseId
      });

      return {
        completionPercentage: enrollment?.progress || 0,
        completedAt: enrollment?.completedAt,
        timeSpent: enrollment?.totalTimeSpent || 0
      };
    } catch (error) {
      return {
        completionPercentage: 0,
        timeSpent: 0
      };
    }
  }

  // Notification methods
  private async notifyNewReview(review: ICourseReview): Promise<void> {
    try {
      const [course, user] = await Promise.all([
        Course.findById(review.courseId).populate('instructorId', 'firstName lastName email'),
        User.findById(review.userId, 'firstName lastName')
      ]);

      if (!course || !course.instructorId) return;

      const instructor = course.instructorId as any;
      const reviewerName = review.isAnonymous ? 'Anonymous' : `${user?.firstName} ${user?.lastName}`;

      // WebSocket notification to instructor
      webSocketService.sendToUser(instructor._id.toString(), {
        type: 'info',
        title: 'New Course Review',
        message: `${reviewerName} left a ${review.rating}-star review for "${course.title}"`,
        actionUrl: `/teacher/courses/${course._id}/reviews`,
        priority: 'normal'
      });

      // Email notification to instructor
      await emailNotificationService.sendEmail({
        to: instructor.email,
        subject: `⭐ New Review for "${course.title}"`,
        html: `
          <h2>You received a new review!</h2>
          <p><strong>Course:</strong> ${course.title}</p>
          <p><strong>Rating:</strong> ${'⭐'.repeat(review.rating)} (${review.rating}/5)</p>
          <p><strong>Reviewer:</strong> ${reviewerName}</p>
          <p><strong>Title:</strong> ${review.title}</p>
          <p><strong>Review:</strong> ${review.content}</p>
          <p>You can respond to this review in your instructor dashboard.</p>
        `,
        type: 'course_update',
        userId: instructor._id,
        courseId: course._id
      });

    } catch (error) {

    }
  }

  private async notifyTeacherResponse(review: ICourseReview): Promise<void> {
    try {
      const [course, user, teacher] = await Promise.all([
        Course.findById(review.courseId),
        User.findById(review.userId),
        User.findById(review.teacherResponse?.userId)
      ]);

      if (!course || !user || !teacher) return;

      // WebSocket notification to reviewer
      webSocketService.sendToUser(user._id.toString(), {
        type: 'info',
        title: 'Instructor Response',
        message: `${teacher.firstName} ${teacher.lastName} responded to your review of "${course.title}"`,
        actionUrl: `/student/courses/${course._id}/reviews`,
        priority: 'normal'
      });

      // Email notification to reviewer
      await emailNotificationService.sendEmail({
        to: user.email,
        subject: `💬 Instructor responded to your review of "${course.title}"`,
        html: `
          <h2>The instructor responded to your review!</h2>
          <p><strong>Course:</strong> ${course.title}</p>
          <p><strong>Instructor:</strong> ${teacher.firstName} ${teacher.lastName}</p>
          <p><strong>Your Review:</strong> ${review.title}</p>
          <p><strong>Instructor's Response:</strong></p>
          <blockquote>${review.teacherResponse?.content}</blockquote>
          <p>View the full conversation in your student dashboard.</p>
        `,
        type: 'course_update',
        userId: user._id,
        courseId: course._id
      });

    } catch (error) {

    }
  }

  private async notifyModerationNeeded(review: ICourseReview, reason?: string): Promise<void> {
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      const course = await Course.findById(review.courseId);

      for (const admin of admins) {
        // WebSocket notification
        webSocketService.sendToUser(admin._id.toString(), {
          type: 'warning',
          title: 'Review Needs Moderation',
          message: `A review for "${course?.title}" has been reported ${review.reportCount} times`,
          actionUrl: `/admin/reviews/moderation/${review._id}`,
          priority: 'high'
        });
      }

    } catch (error) {

    }
  }
}

export const courseRatingService = CourseRatingService.getInstance();
