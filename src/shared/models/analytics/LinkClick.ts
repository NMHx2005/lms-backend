import mongoose, { Document, Schema } from 'mongoose';

export interface ILinkClick extends Document {
  lessonId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  url: string;
  clickedAt: Date;
  userAgent?: string;
  referrer?: string;
  ipAddress?: string;
}

const linkClickSchema = new Schema<ILinkClick>(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
    },
    clickedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userAgent: {
      type: String,
    },
    referrer: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: false, // We use clickedAt instead
  }
);

// Compound index for efficient queries
linkClickSchema.index({ lessonId: 1, userId: 1 });
linkClickSchema.index({ lessonId: 1, clickedAt: -1 });

const LinkClick = mongoose.model<ILinkClick>('LinkClick', linkClickSchema);

export default LinkClick;
