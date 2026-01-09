import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoNote extends Document {
    lessonId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    timestamp: number; // seconds in video
    content: string;
    tags?: string[];
    isPublic: boolean; // share with classmates
    createdAt: Date;
    updatedAt: Date;
}

const videoNoteSchema = new Schema<IVideoNote>({
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
    timestamp: {
        type: Number,
        required: true,
        min: 0
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
videoNoteSchema.index({ lessonId: 1, studentId: 1 });
videoNoteSchema.index({ lessonId: 1, isPublic: 1 });
videoNoteSchema.index({ studentId: 1, createdAt: -1 });

export const VideoNote = mongoose.model<IVideoNote>('VideoNote', videoNoteSchema);
