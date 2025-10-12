import mongoose, { Document, Schema } from 'mongoose';

// RefundRequest interface
export interface IRefundRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  billId: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  amount: number;
  contactMethod: {
    type: 'email' | 'phone' | 'both';
    email?: string;
    phone?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  refundMethod?: 'original_payment' | 'bank_transfer' | 'credit';
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  adminNotes?: string;
  teacherNotes?: string;
  studentNotes?: string;
  rejectionReason?: string;
  refundedAt?: Date;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;

  // Methods
  approve(teacherId: mongoose.Types.ObjectId, notes?: string, refundMethod?: string): Promise<void>;
  reject(teacherId: mongoose.Types.ObjectId, reason: string, notes?: string): Promise<void>;
  cancel(): Promise<void>;
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
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment ID is required'],
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
    contactMethod: {
      type: {
        type: String,
        enum: ['email', 'phone', 'both'],
        required: true
      },
      email: {
        type: String,
        validate: {
          validator: function (v: string) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Invalid email format'
        }
      },
      phone: {
        type: String,
        validate: {
          validator: function (v: string) {
            return !v || /^[0-9]{10,11}$/.test(v);
          },
          message: 'Invalid phone format'
        }
      }
    },
    status: {
      type: String,
      required: [true, 'Refund status is required'],
      enum: {
        values: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
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
      ref: 'User'
    },
    processedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    teacherNotes: {
      type: String,
      maxlength: [1000, 'Teacher notes cannot exceed 1000 characters'],
    },
    studentNotes: {
      type: String,
      maxlength: [1000, 'Student notes cannot exceed 1000 characters'],
    },
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    refundedAt: {
      type: Date,
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
  }).format((this as any).amount);
});

// Virtual for status color
refundRequestSchema.virtual('statusColor').get(function () {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info',
    cancelled: 'info'
  };
  return colors[(this as any).status as keyof typeof colors] || 'secondary';
});

// Virtual for isProcessed
refundRequestSchema.virtual('isProcessed').get(function () {
  return (this as any).status !== 'pending';
});

// Virtual for timeSinceCreation
refundRequestSchema.virtual('timeSinceCreation').get(function () {
  const now = new Date();
  const created = new Date((this as any).createdAt);
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
  const doc = this as any;
  if (
    this.isModified('status') &&
    doc.status !== 'pending' &&
    !doc.processedAt
  ) {
    doc.processedAt = new Date();
  }
  next();
});

// Pre-save middleware to validate amount
refundRequestSchema.pre('save', async function (next) {
  try {
    const doc = this as any;
    const Bill = mongoose.model('Bill');
    const bill: any = await Bill.findById(doc.billId);

    if (!bill) {
      return next(new Error('Bill not found'));
    }

    if (doc.amount > (bill.amount || 0)) {
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
  return this.find({ studentId } as any).sort({ createdAt: -1 });
};

// Static method to find by course
refundRequestSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId } as any).sort({ createdAt: -1 });
};

// Static method to find by status
refundRequestSchema.statics.findByStatus = function (status: string) {
  return this.find({ status } as any).sort({ createdAt: -1 });
};

// Static method to find pending requests
refundRequestSchema.statics.findPending = function () {
  return this.find({ status: 'pending' } as any).sort({ createdAt: 1 });
};

// Static method to find approved requests
refundRequestSchema.statics.findApproved = function () {
  return this.find({ status: 'approved' } as any).sort({ createdAt: -1 });
};

// Instance method to approve (by teacher)
refundRequestSchema.methods.approve = async function (
  teacherId: mongoose.Types.ObjectId,
  notes?: string,
  refundMethod?: string
) {
  (this as any).status = 'approved';
  (this as any).processedBy = teacherId;
  (this as any).processedAt = new Date();
  if (notes) (this as any).teacherNotes = notes;
  if (refundMethod) (this as any).refundMethod = refundMethod;

  await this.save();

  // Update bill status to refunded
  try {
    const Bill = mongoose.model('Bill');
    await Bill.findByIdAndUpdate((this as any).billId, {
      status: 'refunded',
      refundedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating bill status:', error);
  }

  // KICK USER FROM COURSE - Deactivate enrollment
  try {
    const Enrollment = mongoose.model('Enrollment');
    await Enrollment.findByIdAndUpdate((this as any).enrollmentId, {
      isActive: false,
      status: 'refunded',
      refundedAt: new Date()
    });

    // Decrease course student count
    const Course = mongoose.model('Course');
    await Course.findByIdAndUpdate((this as any).courseId, {
      $inc: { totalStudents: -1 }
    });

    // Note: User stats are now calculated dynamically in getDashboardData
    // No need to manually update stored stats

    console.log(`Student kicked from course - Enrollment ${(this as any).enrollmentId} deactivated`);
  } catch (error) {
    console.error('Error deactivating enrollment:', error);
  }
};

// Instance method to reject (by teacher)
refundRequestSchema.methods.reject = async function (
  teacherId: mongoose.Types.ObjectId,
  reason: string,
  notes?: string
) {
  (this as any).status = 'rejected';
  (this as any).processedBy = teacherId;
  (this as any).processedAt = new Date();
  (this as any).rejectionReason = reason;
  if (notes) (this as any).teacherNotes = notes;

  await this.save();
};

// Instance method to cancel (by student)
refundRequestSchema.methods.cancel = async function () {
  if ((this as any).status !== 'pending') {
    throw new Error('Can only cancel pending refund requests');
  }

  (this as any).status = 'cancelled';
  await this.save();
};

// Instance method to complete
refundRequestSchema.methods.complete = async function () {
  (this as any).status = 'completed';
  await this.save();
};

// Export the model
export default mongoose.model<IRefundRequest>(
  'RefundRequest',
  refundRequestSchema
);
