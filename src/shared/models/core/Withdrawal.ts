import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
    teacherId: mongoose.Types.ObjectId;
    amount: number;
    fee: number;
    netAmount: number;
    currency: string;
    method: 'bank_transfer' | 'paypal' | 'stripe' | 'other';
    accountDetails: {
        accountName: string;
        accountNumber: string;
        bankName?: string;
        bankCode?: string;
        [key: string]: any;
    };
    status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';
    notes?: string;
    adminNotes?: string;
    processedBy?: mongoose.Types.ObjectId;
    requestedAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    estimatedCompletionDate?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
    {
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'USD',
            uppercase: true
        },
        method: {
            type: String,
            enum: ['bank_transfer', 'paypal', 'stripe', 'other'],
            required: true
        },
        accountDetails: {
            type: Schema.Types.Mixed,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
            default: 'pending',
            index: true
        },
        notes: {
            type: String,
            maxlength: 500
        },
        adminNotes: {
            type: String,
            maxlength: 1000
        },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        processedAt: {
            type: Date
        },
        completedAt: {
            type: Date
        },
        estimatedCompletionDate: {
            type: Date
        },
        rejectionReason: {
            type: String,
            maxlength: 500
        }
    },
    {
        timestamps: true
    }
);

// Indexes
WithdrawalSchema.index({ teacherId: 1, createdAt: -1 });
WithdrawalSchema.index({ teacherId: 1, status: 1 });
WithdrawalSchema.index({ status: 1, requestedAt: -1 });

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);

