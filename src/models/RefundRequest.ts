import mongoose, { Document, Schema } from 'mongoose';

// RefundRequest interface
export interface IRefundRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  billId: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  refundMethod?: 'original_payment' | 'bank_transfer' | 'credit';
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  adminNotes?: string;
  studentNotes?: string;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// RefundRequest schema
const refundRequestSchema = new Schema<IRefundRequest>(
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
      required: [true, 'Course ID is required'],
      index: true,
    },
    billId: {
      type: Schema.Types.ObjectId,
      ref: 'Bill',
      required: [true, 'Bill ID is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Refund reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      required: [true, 'Refund status is required'],
      enum: {
        values: ['pending', 'approved', 'rejected', 'completed'],
        message: 'Please select a valid status',
      },
      default: 'pending',
    },
    refundMethod: {
      type: String,
      enum: {
        values: ['original_payment', 'bank_transfer', 'credit'],
        message: 'Please select a valid refund method',
      },
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function (processedBy: mongoose.Types.ObjectId) {
          if (!processedBy) return true;
          const User = mongoose.model('User');
          const user = await User.findById(processedBy);
          return user && user.roles.includes('admin');
        },
        message: 'Processor must be a valid admin',
      },
    },
    processedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    studentNotes: {
      type: String,
      maxlength: [1000, 'Student notes cannot exceed 1000 characters'],
    },
    attachments: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
          min: 0,
        },
        type: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
refundRequestSchema.index({ studentId: 1 });
refundRequestSchema.index({ courseId: 1 });
refundRequestSchema.index({ billId: 1 });
refundRequestSchema.index({ status: 1 });
refundRequestSchema.index({ createdAt: -1 });
refundRequestSchema.index({ processedAt: -1 });

// Virtual for student
refundRequestSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
refundRequestSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for bill
refundRequestSchema.virtual('bill', {
  ref: 'Bill',
  localField: 'billId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for processor
refundRequestSchema.virtual('processor', {
  ref: 'User',
  localField: 'processedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for formatted amount
refundRequestSchema.virtual('formattedAmount').get(function () {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(this.amount);
});

// Virtual for status color
refundRequestSchema.virtual('statusColor').get(function () {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info',
  };
  return colors[this.status as keyof typeof colors] || 'secondary';
});

// Virtual for isProcessed
refundRequestSchema.virtual('isProcessed').get(function () {
  return this.status !== 'pending';
});

// Virtual for timeSinceCreation
refundRequestSchema.virtual('timeSinceCreation').get(function () {
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
refundRequestSchema.pre('save', function (next) {
  if (
    this.isModified('status') &&
    this.status !== 'pending' &&
    !this.processedAt
  ) {
    this.processedAt = new Date();
  }
  next();
});

// Pre-save middleware to validate amount
refundRequestSchema.pre('save', async function (next) {
  try {
    const Bill = mongoose.model('Bill');
    const bill = await Bill.findById(this.billId);

    if (!bill) {
      return next(new Error('Bill not found'));
    }

    if (this.amount > bill.amount) {
      return next(new Error('Refund amount cannot exceed bill amount'));
    }
  } catch (error) {
    return next(error as Error);
  }

  next();
});

// Static method to find by student
refundRequestSchema.statics.findByStudent = function (
  studentId: mongoose.Types.ObjectId
) {
  return this.find({ studentId }).sort({ createdAt: -1 });
};

// Static method to find by course
refundRequestSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ createdAt: -1 });
};

// Static method to find by status
refundRequestSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find pending requests
refundRequestSchema.statics.findPending = function () {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

// Static method to find approved requests
refundRequestSchema.statics.findApproved = function () {
  return this.find({ status: 'approved' }).sort({ createdAt: -1 });
};

// Instance method to approve
refundRequestSchema.methods.approve = async function (
  adminId: mongoose.Types.ObjectId,
  notes?: string,
  refundMethod?: string
) {
  this.status = 'approved';
  this.processedBy = adminId;
  this.processedAt = new Date();
  if (notes) this.adminNotes = notes;
  if (refundMethod) this.refundMethod = refundMethod;

  await this.save();

  // Update bill status
  try {
    const Bill = mongoose.model('Bill');
    await Bill.findByIdAndUpdate(this.billId, { status: 'refunded' });
  } catch (error) {
    console.error('Error updating bill status:', error);
  }
};

// Instance method to reject
refundRequestSchema.methods.reject = async function (
  adminId: mongoose.Types.ObjectId,
  notes?: string
) {
  this.status = 'rejected';
  this.processedBy = adminId;
  this.processedAt = new Date();
  if (notes) this.adminNotes = notes;

  await this.save();
};

// Instance method to complete
refundRequestSchema.methods.complete = async function () {
  this.status = 'completed';
  await this.save();
};

// Export the model
export default mongoose.model<IRefundRequest>(
  'RefundRequest',
  refundRequestSchema
);
