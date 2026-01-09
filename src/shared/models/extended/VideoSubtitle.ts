import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoSubtitle extends Document {
    lessonId: mongoose.Types.ObjectId;
    language: string; // 'vi', 'en', 'zh', etc.
    fileUrl: string; // .srt/.vtt file URL
    fileName: string;
    fileSize: number;
    createdAt: Date;
    updatedAt: Date;
}

const videoSubtitleSchema = new Schema<IVideoSubtitle>({
    lessonId: {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
        index: true
    },
    language: {
        type: String,
        required: true,
        default: 'vi'
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Indexes
videoSubtitleSchema.index({ lessonId: 1, language: 1 }, { unique: true });

export const VideoSubtitle = mongoose.model<IVideoSubtitle>('VideoSubtitle', videoSubtitleSchema);
