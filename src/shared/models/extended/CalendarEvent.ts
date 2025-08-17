import mongoose, { Document, Schema } from 'mongoose';

// CalendarEvent interface
export interface ICalendarEvent extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'assignment' | 'exam' | 'reminder' | 'custom';
  startDate: Date;
  endDate?: Date;
  isAllDay: boolean;
  color?: string;
  courseId?: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  reminderTime?: number;
  isRecurring: boolean;
  recurrencePattern?: string;
  createdAt: Date;
  updatedAt: Date;
}

// CalendarEvent schema
const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['assignment', 'exam', 'reminder', 'custom'],
        message: 'Event type must be assignment, exam, reminder, or custom',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: any, endDate: Date) {
          return !endDate || endDate >= this.startDate;
        },
        message: 'End date must be after or equal to start date',
      },
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#007bff',
      validate: {
        validator: function (color: string) {
          return /^#[0-9A-F]{6}$/i.test(color);
        },
        message: 'Color must be a valid hex color code',
      },
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
    reminderTime: {
      type: Number,
      min: [0, 'Reminder time cannot be negative'],
      max: [10080, 'Reminder time cannot exceed 1 week (10080 minutes)'],
      default: 15, // 15 minutes before
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: String,
      validate: {
        validator: function (this: any, pattern: string) {
          if (!this.isRecurring) return true;
          const validPatterns = ['daily', 'weekly', 'monthly', 'yearly'];
          return validPatterns.includes(pattern);
        },
        message: 'Recurrence pattern must be daily, weekly, monthly, or yearly',
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
calendarEventSchema.index({ userId: 1, startDate: 1 });
calendarEventSchema.index({ courseId: 1 });
calendarEventSchema.index({ assignmentId: 1 });
calendarEventSchema.index({ type: 1 });
calendarEventSchema.index({ isRecurring: 1 });
calendarEventSchema.index({ createdAt: -1 });

// Virtual for user
calendarEventSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
calendarEventSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for assignment
calendarEventSchema.virtual('assignment', {
  ref: 'Assignment',
  localField: 'assignmentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for duration
calendarEventSchema.virtual('duration').get(function () {
  if (!this.endDate) return 0;
  return this.endDate.getTime() - this.startDate.getTime();
});

// Virtual for isOverdue
calendarEventSchema.virtual('isOverdue').get(function () {
  return new Date() > this.startDate;
});

// Virtual for timeUntilEvent
calendarEventSchema.virtual('timeUntilEvent').get(function () {
  const now = new Date();
  const eventTime = new Date(this.startDate);
  const diff = eventTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

// Virtual for reminderDate
calendarEventSchema.virtual('reminderDate').get(function () {
  if (!this.reminderTime) return null;
  return new Date(this.startDate.getTime() - (this.reminderTime * 60 * 1000));
});

// Pre-save middleware to validate dates
calendarEventSchema.pre('save', function (next) {
  if (this.endDate && this.endDate < this.startDate) {
    return next(new Error('End date cannot be before start date'));
  }
  
  if (this.type === 'assignment' && !this.assignmentId) {
    return next(new Error('Assignment events must have an assignment ID'));
  }
  
  if (this.type === 'assignment' && !this.courseId) {
    return next(new Error('Assignment events must have a course ID'));
  }
  
  next();
});

// Static method to find by user
calendarEventSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { userId };
  
  if (startDate && endDate) {
    query.startDate = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    query.startDate = { $gte: startDate };
  }
  
  return this.find(query).sort({ startDate: 1 });
};

// Static method to find by course
calendarEventSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ startDate: 1 });
};

// Static method to find upcoming events
calendarEventSchema.statics.findUpcoming = function (
  userId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  const now = new Date();
  return this.find({
    userId,
    startDate: { $gte: now },
  })
    .sort({ startDate: 1 })
    .limit(limit);
};

// Static method to find overdue events
calendarEventSchema.statics.findOverdue = function (
  userId: mongoose.Types.ObjectId
) {
  const now = new Date();
  return this.find({
    userId,
    startDate: { $lt: now },
    type: { $in: ['assignment', 'exam'] },
  }).sort({ startDate: -1 });
};

// Instance method to generate recurring events
calendarEventSchema.methods.generateRecurringEvents = function (
  count: number = 10
) {
  if (!this.isRecurring || !this.recurrencePattern) {
    throw new Error('Event is not recurring');
  }
  
  const events = [];
  let currentDate = new Date(this.startDate);
  
  for (let i = 0; i < count; i++) {
    const event = {
      ...this.toObject(),
      _id: undefined,
      startDate: new Date(currentDate),
      endDate: this.endDate ? new Date(currentDate.getTime() + this.duration) : undefined,
    };
    
    events.push(event);
    
    // Calculate next occurrence
    switch (this.recurrencePattern) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
  }
  
  return events;
};

// Export the model
export default mongoose.model<ICalendarEvent>('CalendarEvent', calendarEventSchema);
