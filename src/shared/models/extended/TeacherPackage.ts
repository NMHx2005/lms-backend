import mongoose, { Document, Schema } from 'mongoose';

// PackagePlan interface
export interface IPackagePlan extends Document {
  name: string;
  description?: string;
  maxCourses: number; // hạn mức số khóa học được phép tạo/đăng tải
  price: number; // đơn vị VND
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean; // soft-delete/disable
  version: number; // tăng khi có thay đổi cấu hình
  createdAt: Date;
  updatedAt: Date;
}

const packagePlanSchema = new Schema<IPackagePlan>(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    maxCourses: {
      type: Number,
      required: true,
      min: [0, 'maxCourses cannot be negative'],
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'price cannot be negative'],
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ['monthly', 'yearly'],
      index: true,
    },
    features: {
      type: [String],
      default: [],
      validate: {
        validator: function (features: string[]) {
          return features.every(f => typeof f === 'string' && f.length <= 120);
        },
        message: 'Each feature must be a string up to 120 chars',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: [1, 'version must be >= 1'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

packagePlanSchema.index({ isActive: 1, version: -1 });
packagePlanSchema.index({ createdAt: -1 });

export const PackagePlan = mongoose.model<IPackagePlan>('PackagePlan', packagePlanSchema);

// TeacherPackageSubscription interface
export interface ITeacherPackageSubscription extends Document {
  teacherId: mongoose.Types.ObjectId; // ref User
  packageId: mongoose.Types.ObjectId; // ref PackagePlan
  status: 'active' | 'cancelled' | 'expired';
  startAt: Date;
  endAt: Date;
  renewedAt?: Date;
  // immutable snapshot of package at subscription time
  snapshot: {
    name: string;
    maxCourses: number;
    billingCycle: 'monthly' | 'yearly';
    features: string[];
    version: number;
    price: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const teacherPackageSubscriptionSchema = new Schema<ITeacherPackageSubscription>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'PackagePlan',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: any, date: Date) {
          return date > this.startAt;
        },
        message: 'endAt must be after startAt',
      },
      index: true,
    },
    renewedAt: {
      type: Date,
    },
    snapshot: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      maxCourses: { type: Number, required: true, min: 0 },
      billingCycle: { type: String, required: true, enum: ['monthly', 'yearly'] },
      features: {
        type: [String],
        default: [],
        validate: {
          validator: function (features: string[]) {
            return features.every(f => typeof f === 'string' && f.length <= 120);
          },
          message: 'Each feature must be a string up to 120 chars',
        },
      },
      version: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

teacherPackageSubscriptionSchema.index({ teacherId: 1, status: 1 });
teacherPackageSubscriptionSchema.index({ teacherId: 1, endAt: 1 });

// Static helpers
teacherPackageSubscriptionSchema.statics.findActiveByTeacher = function (
  teacherId: mongoose.Types.ObjectId
) {
  const now = new Date();
  return this.findOne({ teacherId, status: 'active', endAt: { $gt: now } }).sort({ endAt: -1 });
};

export const TeacherPackageSubscription = mongoose.model<ITeacherPackageSubscription>(
  'TeacherPackageSubscription',
  teacherPackageSubscriptionSchema
);
