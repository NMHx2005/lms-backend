import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    conversationId: string;
    subject: string;
    content: string;
    isRead: boolean;
    readAt?: Date;
    isArchived: boolean;
    archivedAt?: Date;
    attachments?: Array<{
        url: string;
        name: string;
        type: string;
        size?: number;
    }>;
    parentMessageId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        conversationId: {
            type: String,
            required: true,
            index: true
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date
        },
        isArchived: {
            type: Boolean,
            default: false,
            index: true
        },
        archivedAt: {
            type: Date
        },
        attachments: [
            {
                url: { type: String, required: true },
                name: { type: String, required: true },
                type: { type: String, required: true },
                size: { type: Number }
            }
        ],
        parentMessageId: {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        }
    },
    {
        timestamps: true
    }
);

// Indexes for better query performance
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });

// Generate conversation ID from two user IDs (sorted for consistency)
MessageSchema.statics.generateConversationId = function (userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `conv_${sortedIds[0]}_${sortedIds[1]}`;
};

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

