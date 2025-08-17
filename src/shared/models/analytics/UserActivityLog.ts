import mongoose, { Document, Schema } from 'mongoose';

// UserActivityLog interface
export interface IUserActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  lessonId?: mongoose.Types.ObjectId;
  duration?: number;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// UserActivityLog schema
const userActivityLogSchema = new Schema<IUserActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      maxlength: [100, 'Action cannot exceed 100 characters'],
      enum: {
        values: [
          // Authentication actions
          'login', 'logout', 'register', 'password_reset', 'email_verification',
          // Course actions
          'course_view', 'course_enroll', 'course_unenroll', 'course_complete',
          'lesson_view', 'lesson_start', 'lesson_complete', 'lesson_pause',
          'section_view', 'section_complete',
          // Assignment actions
          'assignment_view', 'assignment_start', 'assignment_submit', 'assignment_grade',
          // Content actions
          'video_play', 'video_pause', 'video_seek', 'video_complete',
          'file_download', 'file_view', 'link_click',
          // Social actions
          'comment_create', 'comment_edit', 'comment_delete',
          'rating_create', 'rating_edit', 'rating_delete',
          'review_create', 'review_edit', 'review_delete',
          // Profile actions
          'profile_view', 'profile_edit', 'settings_update',
          // Payment actions
          'payment_initiate', 'payment_complete', 'payment_failed',
          'subscription_start', 'subscription_cancel', 'subscription_renew',
          // Other actions
          'search', 'filter', 'sort', 'export', 'import'
        ],
        message: 'Please select a valid action',
      },
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      maxlength: [100, 'Resource cannot exceed 100 characters'],
      enum: {
        values: [
          'user', 'course', 'lesson', 'section', 'assignment', 'submission',
          'enrollment', 'payment', 'subscription', 'comment', 'rating', 'review',
          'file', 'video', 'link', 'search', 'filter', 'export', 'system'
        ],
        message: 'Please select a valid resource',
      },
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      index: true,
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
      max: [86400, 'Duration cannot exceed 24 hours (86400 seconds)'],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: [45, 'IP address cannot exceed 45 characters'],
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userActivityLogSchema.index({ userId: 1, createdAt: -1 });
userActivityLogSchema.index({ action: 1 });
userActivityLogSchema.index({ resource: 1 });
userActivityLogSchema.index({ courseId: 1 });
userActivityLogSchema.index({ lessonId: 1 });
userActivityLogSchema.index({ createdAt: -1 });
userActivityLogSchema.index({ userId: 1, courseId: 1, createdAt: -1 });
userActivityLogSchema.index({ userId: 1, action: 1, createdAt: -1 });

// TTL index to automatically delete old logs (keep for 1 year)
userActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Virtual for user
userActivityLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
userActivityLogSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for lesson
userActivityLogSchema.virtual('lesson', {
  ref: 'Lesson',
  localField: 'lessonId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for formatted duration
userActivityLogSchema.virtual('formattedDuration').get(function () {
  if (!this.duration) return 'N/A';
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Virtual for time since creation
userActivityLogSchema.virtual('timeSinceCreation').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diff = now.getTime() - created.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Pre-save middleware to validate resource consistency
userActivityLogSchema.pre('save', function (next) {
  // If action is course-related, courseId should be provided
  if (['course_view', 'course_enroll', 'course_unenroll', 'course_complete'].includes(this.action)) {
    if (!this.courseId) {
      return next(new Error('Course ID is required for course-related actions'));
    }
  }
  
  // If action is lesson-related, both courseId and lessonId should be provided
  if (['lesson_view', 'lesson_start', 'lesson_complete', 'lesson_pause'].includes(this.action)) {
    if (!this.courseId || !this.lessonId) {
      return next(new Error('Course ID and Lesson ID are required for lesson-related actions'));
    }
  }
  
  // If action is assignment-related, courseId should be provided
  if (['assignment_view', 'assignment_start', 'assignment_submit', 'assignment_grade'].includes(this.action)) {
    if (!this.courseId) {
      return next(new Error('Course ID is required for assignment-related actions'));
    }
  }
  
  next();
});

// Static method to find by user
userActivityLogSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    skip?: number;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    resource?: string;
  } = {}
) {
  const { limit = 100, skip = 0, startDate, endDate, action, resource } = options;
  
  const query: any = { userId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  if (action) query.action = action;
  if (resource) query.resource = resource;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find by course
userActivityLogSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    skip?: number;
    startDate?: Date;
    endDate?: Date;
    action?: string;
  } = {}
) {
  const { limit = 100, skip = 0, startDate, endDate, action } = options;
  
  const query: any = { courseId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  if (action) query.action = action;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find by action
userActivityLogSchema.statics.findByAction = function (
  action: string,
  options: {
    limit?: number;
    skip?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { limit = 100, skip = 0, startDate, endDate } = options;
  
  const query: any = { action };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user activity summary
userActivityLogSchema.statics.getUserActivitySummary = function (
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    { $match: { userId, createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource',
        },
        count: { $sum: 1 },
        totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
        lastActivity: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Static method to get course engagement metrics
userActivityLogSchema.statics.getCourseEngagement = function (
  courseId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    { $match: { courseId, createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$userId',
        totalActions: { $sum: 1 },
        totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
        lastActivity: { $max: '$createdAt' },
        actions: { $push: '$action' },
      },
    },
    {
      $group: {
        _id: null,
        uniqueUsers: { $sum: 1 },
        totalActions: { $sum: '$totalActions' },
        totalDuration: { $sum: '$totalDuration' },
        averageActionsPerUser: { $avg: '$totalActions' },
        averageDurationPerUser: { $avg: '$totalDuration' },
      },
    },
  ]);
};

// Export the model
export default mongoose.model<IUserActivityLog>('UserActivityLog', userActivityLogSchema);
