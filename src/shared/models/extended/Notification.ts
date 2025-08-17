import mongoose, { Document, Schema } from 'mongoose';

// Notification interface
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'assignment';
  isRead: boolean;
  isArchived: boolean;
  courseId?: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  actionUrl?: string;
  metadata?: any;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['info', 'success', 'warning', 'error', 'course', 'assignment'],
        message: 'Notification type must be info, success, warning, error, course, or assignment',
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      index: true,
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'Action URL cannot exceed 500 characters'],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
      validate: {
        validator: function (expiresAt: Date) {
          return !expiresAt || expiresAt > new Date();
        },
        message: 'Expiration date must be in the future',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, isArchived: 1 });
notificationSchema.index({ courseId: 1 });
notificationSchema.index({ assignmentId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for user
notificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
notificationSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for assignment
notificationSchema.virtual('assignment', {
  ref: 'Assignment',
  localField: 'assignmentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for isExpired
notificationSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for timeSinceCreation
notificationSchema.virtual('timeSinceCreation').get(function () {
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

// Virtual for priority
notificationSchema.virtual('priority').get(function () {
  switch (this.type) {
    case 'error':
      return 1;
    case 'warning':
      return 2;
    case 'assignment':
      return 3;
    case 'course':
      return 4;
    case 'success':
      return 5;
    case 'info':
      return 6;
    default:
      return 7;
  }
});

// Pre-save middleware to validate related IDs
notificationSchema.pre('save', function (next) {
  if (this.type === 'course' && !this.courseId) {
    return next(new Error('Course notifications must have a course ID'));
  }
  
  if (this.type === 'assignment' && !this.assignmentId) {
    return next(new Error('Assignment notifications must have an assignment ID'));
  }
  
  next();
});

// Static method to find by user
notificationSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  options: {
    unreadOnly?: boolean;
    archived?: boolean;
    limit?: number;
    skip?: number;
  } = {}
) {
  const { unreadOnly = false, archived = false, limit = 50, skip = 0 } = options;
  
  const query: any = { userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (archived !== undefined) {
    query.isArchived = archived;
  }
  
  return this.find(query)
    .sort({ priority: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find unread count
notificationSchema.statics.findUnreadCount = function (
  userId: mongoose.Types.ObjectId
) {
  return this.countDocuments({
    userId,
    isRead: false,
    isArchived: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

// Static method to find by course
notificationSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ createdAt: -1 });
};

// Static method to find by assignment
notificationSchema.statics.findByAssignment = function (
  assignmentId: mongoose.Types.ObjectId
) {
  return this.find({ assignmentId }).sort({ createdAt: -1 });
};

// Static method to find expired notifications
notificationSchema.statics.findExpired = function () {
  return this.find({
    expiresAt: { $lt: new Date() },
    isArchived: false,
  });
};

// Static method to create bulk notifications
notificationSchema.statics.createBulk = function (
  notifications: Array<{
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: string;
    courseId?: mongoose.Types.ObjectId;
    assignmentId?: mongoose.Types.ObjectId;
    actionUrl?: string;
    metadata?: any;
    expiresAt?: Date;
  }>
) {
  return this.insertMany(notifications);
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  await this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = async function () {
  this.isRead = false;
  await this.save();
};

// Instance method to archive
notificationSchema.methods.archive = async function () {
  this.isArchived = true;
  await this.save();
};

// Instance method to unarchive
notificationSchema.methods.unarchive = async function () {
  this.isArchived = false;
  await this.save();
};

// Export the model
export default mongoose.model<INotification>('Notification', notificationSchema);
