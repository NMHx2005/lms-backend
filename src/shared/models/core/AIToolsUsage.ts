import mongoose, { Schema, Document } from 'mongoose';

export interface IAIToolsUsage extends Document {
    userId: mongoose.Types.ObjectId;
    tool: string;
    category: 'content' | 'assessment' | 'media' | 'moderation' | 'translation' | 'other';
    action: string;
    creditsUsed: number;
    inputData?: {
        [key: string]: any;
    };
    outputData?: {
        [key: string]: any;
    };
    metadata?: {
        tokens?: number;
        processingTime?: number;
        modelVersion?: string;
        [key: string]: any;
    };
    status: 'success' | 'failed' | 'pending';
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AIToolsUsageSchema = new Schema<IAIToolsUsage>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        tool: {
            type: String,
            required: true,
            index: true
        },
        category: {
            type: String,
            enum: ['content', 'assessment', 'media', 'moderation', 'translation', 'other'],
            required: true,
            index: true
        },
        action: {
            type: String,
            required: true
        },
        creditsUsed: {
            type: Number,
            required: true,
            min: 0
        },
        inputData: {
            type: Schema.Types.Mixed
        },
        outputData: {
            type: Schema.Types.Mixed
        },
        metadata: {
            type: Schema.Types.Mixed
        },
        status: {
            type: String,
            enum: ['success', 'failed', 'pending'],
            default: 'success',
            index: true
        },
        errorMessage: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Indexes for better query performance
AIToolsUsageSchema.index({ userId: 1, createdAt: -1 });
AIToolsUsageSchema.index({ userId: 1, tool: 1, createdAt: -1 });
AIToolsUsageSchema.index({ userId: 1, category: 1, createdAt: -1 });

export const AIToolsUsage = mongoose.model<IAIToolsUsage>('AIToolsUsage', AIToolsUsageSchema);

