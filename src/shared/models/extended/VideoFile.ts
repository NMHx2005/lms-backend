import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoFormat {
    quality: '360p' | '480p' | '720p' | '1080p' | 'original';
    url: string;
    fileSize: number; // bytes
    width?: number;
    height?: number;
}

export interface IVideoFile extends Document {
    lessonId: mongoose.Types.ObjectId;
    originalFileName: string;
    fileUrl: string; // original file URL
    fileSize: number; // bytes
    duration: number; // seconds
    formats: IVideoFormat[];
    thumbnails: string[]; // thumbnail URLs
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    processingError?: string;
    createdAt: Date;
    updatedAt: Date;
}

const videoFormatSchema = new Schema<IVideoFormat>({
    quality: {
        type: String,
        enum: ['360p', '480p', '720p', '1080p', 'original'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    width: Number,
    height: Number
}, { _id: false });

const videoFileSchema = new Schema<IVideoFile>({
    lessonId: {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
        unique: true,
        index: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        default: 0
    },
    formats: [videoFormatSchema],
    thumbnails: [String],
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    processingError: String
}, {
    timestamps: true
});

export const VideoFile = mongoose.model<IVideoFile>('VideoFile', videoFileSchema);
