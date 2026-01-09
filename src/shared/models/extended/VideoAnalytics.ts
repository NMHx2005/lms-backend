import mongoose, { Document, Schema } from 'mongoose';

export interface IWatchEvent {
  timestamp: number; // video timestamp in seconds
  action: 'play' | 'pause' | 'seek' | 'complete' | 'exit';
  timeSpent: number; // seconds
  createdAt: Date;
}

export interface IVideoAnalytics extends Document {
  lessonId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  watchEvents: IWatchEvent[];
  totalWatchTime: number; // total seconds
  completionRate: number; // 0-100
  lastUpdated: Date;
  createdAt: Date;
}

const watchEventSchema = new Schema<IWatchEvent>({
  timestamp: {
    type: Number,
    required: true,
    min: 0
  },
  action: {
    type: String,
    enum: ['play', 'pause', 'seek', 'complete', 'exit'],
    required: true
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const videoAnalyticsSchema = new Schema<IVideoAnalytics>({
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  watchEvents: [watchEventSchema],
  totalWatchTime: {
    type: Number,
    default: 0,
    min: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
videoAnalyticsSchema.index({ lessonId: 1, studentId: 1 }, { unique: true });
videoAnalyticsSchema.index({ lessonId: 1, lastUpdated: -1 });

export const VideoAnalytics = mongoose.model<IVideoAnalytics>('VideoAnalytics', videoAnalyticsSchema);
