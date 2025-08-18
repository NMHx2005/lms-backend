import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface IOrderItem {
  productId?: mongoose.Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  amount: number;
  currency: 'VND' | 'USD' | 'EUR';
  status: OrderStatus;
  txnRef?: string; // VNPay reference if any
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
    currency: { type: String, enum: ['VND', 'USD', 'EUR'], default: 'VND' },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    txnRef: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', orderSchema);


