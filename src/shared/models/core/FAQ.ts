import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
    question: string;
    answer: string;
    category: string;
    isPublished: boolean;
    viewCount: number;
    helpfulCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>({
    question: {
        type: String,
        required: [true, 'Question là bắt buộc'],
        trim: true,
        maxlength: [500, 'Question không được vượt quá 500 ký tự']
    },
    answer: {
        type: String,
        required: [true, 'Answer là bắt buộc'],
        trim: true,
        maxlength: [2000, 'Answer không được vượt quá 2000 ký tự']
    },
    category: {
        type: String,
        required: [true, 'Category là bắt buộc'],
        trim: true,
        maxlength: [100, 'Category không được vượt quá 100 ký tự']
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    viewCount: {
        type: Number,
        default: 0
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
FAQSchema.index({ category: 1 });
FAQSchema.index({ isPublished: 1 });
FAQSchema.index({ createdAt: -1 });

export default mongoose.model<IFAQ>('FAQ', FAQSchema);
