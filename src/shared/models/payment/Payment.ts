import mongoose, { Document, Schema } from 'mongoose';

export type PaymentGateway = 'vnpay' | 'stripe' | 'momo' | 'zalopay';
export type PaymentCurrency = 'VND' | 'USD' | 'EUR';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  gateway: PaymentGateway;
  amount: number;
  currency: PaymentCurrency;
  txnRef: string; // vnp_TxnRef
  transactionNo?: string; // vnp_TransactionNo
  bankCode?: string; // vnp_BankCode
  responseCode?: string; // vnp_ResponseCode
  transactionStatus?: string; // vnp_TransactionStatus
  secureHash?: string; // vnp_SecureHash (for logging)
  status: PaymentStatus;
  rawReturn?: any; // payload at Return URL
  rawIpn?: any; // payload at IPN URL
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gateway: {
      type: String,
      enum: { values: ['vnpay', 'stripe', 'momo', 'zalopay'], message: 'Invalid payment gateway' },
      required: true,
      default: 'vnpay'
    },
    amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
    currency: {
      type: String,
      enum: { values: ['VND', 'USD', 'EUR'], message: 'Invalid currency' },
      default: 'VND'
    },
    txnRef: { type: String, required: true, index: true },
    transactionNo: { type: String },
    bankCode: { type: String },
    responseCode: { type: String },
    transactionStatus: { type: String },
    secureHash: { type: String },
    status: {
      type: String,
      enum: { values: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'], message: 'Invalid status' },
      default: 'PENDING',
      index: true
    },
    rawReturn: { type: Schema.Types.Mixed },
    rawIpn: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
    refundedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ orderId: 1, status: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);


