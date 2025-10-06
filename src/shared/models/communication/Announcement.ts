import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: 'general' | 'course' | 'urgent' | 'maintenance' | 'update';
  priority: 'low' | 'normal' | 'high' | 'urgent';

  // Target audience
  target: {
    type: 'all' | 'role' | 'course' | 'user';
    value?: string | string[]; // role name, course ID, or user IDs
  };

  // Scheduling
  isScheduled: boolean;
  scheduledAt?: Date;
  publishedAt?: Date;
  expiresAt?: Date;

  // Status
  status: 'draft' | 'scheduled' | 'published' | 'expired' | 'cancelled';

  // Media attachments
  attachments?: {
    type: 'image' | 'video' | 'document';
    url: string;
    filename: string;
    size: number;
  }[];

  // Display options
  displayOptions: {
    showAsPopup: boolean;
    showOnDashboard: boolean;
    sendEmail: boolean;
    sendPush: boolean;
    requireAcknowledgment: boolean;
  };

  // Acknowledgments
  acknowledgedBy?: {
    userId: mongoose.Types.ObjectId;
    acknowledgedAt: Date;
  }[];

  // Analytics
  analytics: {
    totalViews: number;
    totalClicks: number;
    totalAcknowledgments: number;
    lastViewedAt?: Date;
  };

  // Author
  createdBy: {
    userId: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };

  updatedBy?: {
    userId: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };

  // Tags for organization
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters']
    },
    type: {
      type: String,
      required: [true, 'Announcement type is required'],
      enum: {
        values: ['general', 'course', 'urgent', 'maintenance', 'update'],
        message: 'Invalid announcement type'
      }
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'normal', 'high', 'urgent'],
        message: 'Invalid priority level'
      },
      default: 'normal'
    },
    target: {
      type: {
        type: String,
        required: [true, 'Target type is required'],
        enum: {
          values: ['all', 'role', 'course', 'user'],
          message: 'Invalid target type'
        }
      },
      value: {
        type: Schema.Types.Mixed,
        validate: {
          validator: function (this: IAnnouncement, value: any) {
            if (this.target.type === 'all') {
              return value === undefined || value === null;
            }
            return value !== undefined && value !== null;
          },
          message: 'Target value is required for specific targeting'
        }
      }
    },
    isScheduled: {
      type: Boolean,
      default: false
    },
    scheduledAt: {
      type: Date,
      validate: {
        validator: function (this: IAnnouncement, scheduledAt: Date) {
          if (this.isScheduled && scheduledAt) {
            return scheduledAt > new Date();
          }
          return true;
        },
        message: 'Scheduled date must be in the future'
      }
    },
    publishedAt: {
      type: Date,
      index: true
    },
    expiresAt: {
      type: Date,
      validate: {
        validator: function (expiresAt: Date) {
          return !expiresAt || expiresAt > new Date();
        },
        message: 'Expiration date must be in the future'
      },
      index: true
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['draft', 'scheduled', 'published', 'expired', 'cancelled'],
        message: 'Invalid status'
      },
      default: 'draft',
      index: true
    },
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'video', 'document'],
        required: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      },
      filename: {
        type: String,
        required: true,
        trim: true
      },
      size: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    displayOptions: {
      showAsPopup: {
        type: Boolean,
        default: false
      },
      showOnDashboard: {
        type: Boolean,
        default: true
      },
      sendEmail: {
        type: Boolean,
        default: true
      },
      sendPush: {
        type: Boolean,
        default: true
      },
      requireAcknowledgment: {
        type: Boolean,
        default: false
      }
    },
    acknowledgedBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      acknowledgedAt: {
        type: Date,
        default: Date.now
      }
    }],
    analytics: {
      totalViews: {
        type: Number,
        default: 0,
        min: 0
      },
      totalClicks: {
        type: Number,
        default: 0,
        min: 0
      },
      totalAcknowledgments: {
        type: Number,
        default: 0,
        min: 0
      },
      lastViewedAt: {
        type: Date
      }
    },
    createdBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator user ID is required']
      },
      name: {
        type: String,
        required: [true, 'Creator name is required'],
        trim: true
      },
      role: {
        type: String,
        required: [true, 'Creator role is required'],
        trim: true
      }
    },
    updatedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        type: String,
        trim: true
      },
      role: {
        type: String,
        trim: true
      }
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
AnnouncementSchema.index({ status: 1, publishedAt: -1 });
AnnouncementSchema.index({ 'target.type': 1, 'target.value': 1 });
AnnouncementSchema.index({ type: 1, priority: 1 });
AnnouncementSchema.index({ scheduledAt: 1 });
AnnouncementSchema.index({ expiresAt: 1 });
AnnouncementSchema.index({ tags: 1 });
AnnouncementSchema.index({ 'createdBy.userId': 1 });

// Compound indexes
AnnouncementSchema.index({ status: 1, 'target.type': 1, publishedAt: -1 });
AnnouncementSchema.index({ isScheduled: 1, scheduledAt: 1, status: 1 });

// Virtual for acknowledgment percentage
AnnouncementSchema.virtual('acknowledgmentRate').get(function (this: IAnnouncement) {
  if (!this.displayOptions.requireAcknowledgment) return null;

  const totalAcknowledged = this.acknowledgedBy?.length || 0;
  const totalViews = this.analytics.totalViews || 1;

  return Math.round((totalAcknowledged / totalViews) * 100);
});

// Virtual for time remaining until expiry
AnnouncementSchema.virtual('timeUntilExpiry').get(function (this: IAnnouncement) {
  if (!this.expiresAt) return null;

  const now = new Date();
  const timeDiff = this.expiresAt.getTime() - now.getTime();

  if (timeDiff <= 0) return 'Expired';

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days} days`;
  if (hours > 0) return `${hours} hours`;
  return 'Less than 1 hour';
});

// Pre-save middleware
AnnouncementSchema.pre('save', function (this: IAnnouncement, next) {
  // Auto-publish if scheduled time has passed
  if (this.isScheduled && this.scheduledAt && this.status === 'scheduled') {
    if (this.scheduledAt <= new Date()) {
      this.status = 'published';
      this.publishedAt = new Date();
      this.isScheduled = false;
    }
  }

  // Set published date when status changes to published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Update acknowledgment count
  this.analytics.totalAcknowledgments = this.acknowledgedBy?.length || 0;

  next();
});

// Pre-find middleware to handle expired announcements
AnnouncementSchema.pre(/^find/, function (this: any, next) {
  // Auto-expire announcements
  this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      status: { $ne: 'expired' }
    },
    { status: 'expired' }
  );

  next();
});

// Static methods
AnnouncementSchema.statics.findActive = function () {
  return this.find({
    status: 'published',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ priority: 1, publishedAt: -1 });
};

AnnouncementSchema.statics.findByTarget = function (targetType: string, targetValue?: string) {
  const query: any = {
    status: 'published',
    'target.type': targetType,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (targetType !== 'all' && targetValue) {
    if (targetType === 'user') {
      query['target.value'] = { $in: [targetValue] };
    } else {
      query['target.value'] = targetValue;
    }
  }

  return this.find(query).sort({ priority: 1, publishedAt: -1 });
};

AnnouncementSchema.statics.findScheduled = function () {
  return this.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date() }
  });
};

AnnouncementSchema.statics.findExpiring = function (hours: number = 24) {
  const expiryThreshold = new Date();
  expiryThreshold.setHours(expiryThreshold.getHours() + hours);

  return this.find({
    status: 'published',
    expiresAt: {
      $exists: true,
      $gt: new Date(),
      $lte: expiryThreshold
    }
  });
};

// Instance methods
AnnouncementSchema.methods.acknowledge = function (userId: mongoose.Types.ObjectId) {
  if (!this.acknowledgedBy) this.acknowledgedBy = [];

  const alreadyAcknowledged = this.acknowledgedBy.some((ack: any) =>
    ack.userId.toString() === userId.toString()
  );

  if (!alreadyAcknowledged) {
    this.acknowledgedBy.push({
      userId,
      acknowledgedAt: new Date()
    });

    this.analytics.totalAcknowledgments = this.acknowledgedBy.length;
  }

  return this.save();
};

AnnouncementSchema.methods.incrementView = function () {
  this.analytics.totalViews += 1;
  this.analytics.lastViewedAt = new Date();
  return this.save();
};

AnnouncementSchema.methods.incrementClick = function () {
  this.analytics.totalClicks += 1;
  return this.save();
};

AnnouncementSchema.methods.publish = function () {
  this.status = 'published';
  this.publishedAt = new Date();
  this.isScheduled = false;
  return this.save();
};

AnnouncementSchema.methods.cancel = function () {
  this.status = 'cancelled';
  return this.save();
};

AnnouncementSchema.methods.expire = function () {
  this.status = 'expired';
  return this.save();
};

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema, 'announcements');
