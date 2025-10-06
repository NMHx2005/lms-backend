import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  courseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Tên danh mục là bắt buộc'],
    trim: true,
    unique: true,
    maxlength: [100, 'Tên danh mục không được vượt quá 100 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  courseCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ isActive: 1 });

// Virtual for formatted dates
CategorySchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('vi-VN');
});

CategorySchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt.toLocaleDateString('vi-VN');
});

export default mongoose.model<ICategory>('Category', CategorySchema);
