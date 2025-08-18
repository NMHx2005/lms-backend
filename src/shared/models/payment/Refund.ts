import mongoose, { Document, Schema } from 'mongoose';

export type RefundStatus = 'REQUESTED' | 'PROCESSING' | 'REFUNDED' | 'REJECTED';

export interface IRefund extends Document {
  paymentId: mongoose.Types.ObjectId;
  amount: number;
  reason?: string;
  status: RefundStatus;
  providerRef?: string;
  requestedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
    reason: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['REQUESTED', 'PROCESSING', 'REFUNDED', 'REJECTED'],
      default: 'REQUESTED',
      index: true
    },
    providerRef: { type: String },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date }
  },
  { timestamps: true }
);

refundSchema.index({ createdAt: -1 });

export default mongoose.model<IRefund>('Refund', refundSchema);


