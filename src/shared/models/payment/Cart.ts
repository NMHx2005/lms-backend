import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId?: mongoose.Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] }
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model<ICart>('Cart', cartSchema);


