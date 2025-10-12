import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: {
        courseId?: string;
        page?: string;
        metadata?: any;
    };
}

export interface IChatHistory extends Document {
    _id: string;
    userId: string;
    sessionId: string;
    messages: IChatMessage[];
    context: {
        currentPage?: string;
        courseId?: string;
        userPreferences?: any;
    };
    isActive: boolean;
    expiresAt: Date; // For TTL auto-cleanup
    createdAt: Date;
    updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    context: {
        courseId: String,
        page: String,
        metadata: Schema.Types.Mixed
    }
});

const chatHistorySchema = new Schema<IChatHistory>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    messages: [chatMessageSchema],
    context: {
        currentPage: String,
        courseId: String,
        userPreferences: Schema.Types.Mixed
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        index: true
    }
}, {
    timestamps: true,
    collection: 'chat_histories'
});

// Indexes for better performance
chatHistorySchema.index({ userId: 1, sessionId: 1 });
chatHistorySchema.index({ userId: 1, isActive: 1 });
chatHistorySchema.index({ createdAt: -1 });

// TTL Index for automatic cleanup after 5 minutes
chatHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
chatHistorySchema.statics.findActiveSession = function (userId: string) {
    return this.findOne({ userId, isActive: true }).sort({ updatedAt: -1 });
};

chatHistorySchema.statics.createNewSession = function (userId: string, context: any) {
    return this.create({
        userId,
        sessionId: new mongoose.Types.ObjectId().toString(),
        messages: [],
        context,
        isActive: true
    });
};

chatHistorySchema.statics.getUserChatHistory = function (userId: string, limit: number = 50) {
    return this.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select('sessionId messages context createdAt updatedAt');
};

// Instance methods
chatHistorySchema.methods.addMessage = function (message: IChatMessage) {
    this.messages.push(message);
    this.updatedAt = new Date();
    return this.save();
};

chatHistorySchema.methods.endSession = function () {
    this.isActive = false;
    return this.save();
};

chatHistorySchema.methods.getLastMessages = function (count: number = 10) {
    return this.messages.slice(-count);
};

// Virtual for message count
chatHistorySchema.virtual('messageCount').get(function () {
    return this.messages.length;
});

// Transform JSON output
chatHistorySchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);

export default ChatHistory;
