import mongoose, { Document, Schema } from 'mongoose';

// Bill interface
export interface IBill extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  purpose: 'course_purchase' | 'subscription' | 'refund' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'cash';
  paymentGateway?: string;
  transactionId?: string;
  description: string;
  metadata?: any;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Bill schema
const billSchema = new Schema<IBill>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Bill amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'VND',
      enum: {
        values: ['VND', 'USD', 'EUR', 'JPY', 'KRW'],
        message: 'Please select a valid currency',
      },
    },
    purpose: {
      type: String,
      required: [true, 'Bill purpose is required'],
      enum: {
        values: ['course_purchase', 'subscription', 'refund', 'other'],
        message: 'Please select a valid purpose',
      },
    },
    status: {
      type: String,
      required: [true, 'Bill status is required'],
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
        message: 'Please select a valid status',
      },
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['stripe', 'paypal', 'bank_transfer', 'cash'],
        message: 'Please select a valid payment method',
      },
    },
    paymentGateway: {
      type: String,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      required: [true, 'Bill description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    paidAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
billSchema.index({ studentId: 1 });
billSchema.index({ courseId: 1 });
billSchema.index({ status: 1 });
billSchema.index({ purpose: 1 });
billSchema.index({ paymentMethod: 1 });
billSchema.index({ createdAt: -1 });
billSchema.index({ paidAt: -1 });
billSchema.index({ transactionId: 1 });

// Virtual for student
billSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
billSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for formatted amount
billSchema.virtual('formattedAmount').get(function () {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: this.currency,
  });
  return formatter.format(this.amount);
});

// Virtual for status color
billSchema.virtual('statusColor').get(function () {
  const colors = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger',
    refunded: 'info',
    cancelled: 'secondary',
  };
  return colors[this.status as keyof typeof colors] || 'secondary';
});

// Virtual for isPaid
billSchema.virtual('isPaid').get(function () {
  return this.status === 'completed';
});

// Virtual for isRefunded
billSchema.virtual('isRefunded').get(function () {
  return this.status === 'refunded';
});

// Virtual for timeSinceCreation
billSchema.virtual('timeSinceCreation').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diff = now.getTime() - created.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Pre-save middleware to update timestamps
billSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.paidAt) {
      this.paidAt = new Date();
    }
    if (this.status === 'refunded' && !this.refundedAt) {
      this.refundedAt = new Date();
    }
  }
  next();
});

// Pre-save middleware to validate course purchase
billSchema.pre('save', function (next) {
  if (this.purpose === 'course_purchase' && !this.courseId) {
    return next(new Error('Course ID is required for course purchase bills'));
  }
  next();
});

// Static method to find by student
billSchema.statics.findByStudent = function (
  studentId: mongoose.Types.ObjectId
) {
  return this.find({ studentId }).sort({ createdAt: -1 });
};

// Static method to find by course
billSchema.statics.findByCourse = function (courseId: mongoose.Types.ObjectId) {
  return this.find({ courseId }).sort({ createdAt: -1 });
};

// Static method to find by status
billSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find by purpose
billSchema.statics.findByPurpose = function (purpose: string) {
  return this.find({ purpose }).sort({ createdAt: -1 });
};

// Static method to find pending bills
billSchema.statics.findPending = function () {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

// Static method to find completed bills
billSchema.statics.findCompleted = function () {
  return this.find({ status: 'completed' }).sort({ paidAt: -1 });
};

// Instance method to mark as paid
billSchema.methods.markAsPaid = async function (transactionId?: string) {
  this.status = 'completed';
  this.paidAt = new Date();
  if (transactionId) {
    this.transactionId = transactionId;
  }
  await this.save();
};

// Instance method to mark as failed
billSchema.methods.markAsFailed = async function () {
  this.status = 'failed';
  await this.save();
};

// Instance method to mark as refunded
billSchema.methods.markAsRefunded = async function () {
  this.status = 'refunded';
  this.refundedAt = new Date();
  await this.save();
};

// Instance method to cancel
billSchema.methods.cancel = async function () {
  this.status = 'cancelled';
  await this.save();
};

// Export the model
export default mongoose.model<IBill>('Bill', billSchema);
