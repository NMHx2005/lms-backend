import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoProgress extends Document {
    lessonId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    currentTime: number; // seconds
    progress: number; // 0-100
    watchTime: number; // total seconds watched
    completed: boolean;
    lastWatchedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const videoProgressSchema = new Schema<IVideoProgress>({
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
    currentTime: {
        type: Number,
        default: 0,
        min: 0
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    watchTime: {
        type: Number,
        default: 0,
        min: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    lastWatchedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
videoProgressSchema.index({ lessonId: 1, studentId: 1 }, { unique: true });
videoProgressSchema.index({ studentId: 1, completed: 1 });
videoProgressSchema.index({ lessonId: 1, completed: 1 });

export const VideoProgress = mongoose.model<IVideoProgress>('VideoProgress', videoProgressSchema);
