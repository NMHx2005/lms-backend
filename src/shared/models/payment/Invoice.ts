import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  orderId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  number: string; // invoice code/number
  amount: number;
  currency: 'VND' | 'USD' | 'EUR';
  fileUrl?: string; // stored PDF/HTML path
  html?: string; // quick HTML snapshot (sandbox)
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
    currency: { type: String, enum: ['VND', 'USD', 'EUR'], default: 'VND' },
    fileUrl: { type: String },
    html: { type: String },
    issuedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

invoiceSchema.index({ createdAt: -1 });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);


