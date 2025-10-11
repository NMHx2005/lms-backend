import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    teacherId: mongoose.Types.ObjectId;
    type: 'sale' | 'refund' | 'adjustment' | 'withdrawal' | 'commission';
    amount: number;
    fee: number;
    netAmount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    description: string;
    courseId?: mongoose.Types.ObjectId;
    studentId?: mongoose.Types.ObjectId;
    billId?: mongoose.Types.ObjectId;
    withdrawalId?: mongoose.Types.ObjectId;
    paymentMethod?: string;
    metadata?: {
        [key: string]: any;
    };
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ['sale', 'refund', 'adjustment', 'withdrawal', 'commission'],
            required: true,
            index: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        fee: {
            type: Number,
            default: 0,
            min: 0
        },
        netAmount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD',
            uppercase: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'pending',
            index: true
        },
        description: {
            type: String,
            required: true,
            maxlength: 500
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            index: true
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        billId: {
            type: Schema.Types.ObjectId,
            ref: 'Bill'
        },
        withdrawalId: {
            type: Schema.Types.ObjectId,
            ref: 'Withdrawal'
        },
        paymentMethod: {
            type: String
        },
        metadata: {
            type: Schema.Types.Mixed
        },
        completedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// Indexes for better query performance
TransactionSchema.index({ teacherId: 1, createdAt: -1 });
TransactionSchema.index({ teacherId: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ teacherId: 1, status: 1 });
TransactionSchema.index({ courseId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

