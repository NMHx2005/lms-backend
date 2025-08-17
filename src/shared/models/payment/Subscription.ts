import mongoose, { Document, Schema } from 'mongoose';

// Subscription interface
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'pro' | 'advanced';
  status: 'active' | 'expired' | 'cancelled' | 'suspended';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate?: Date;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  user?: any;
  cancelledByUser?: any;
  isActive: boolean;
  isExpired: boolean;
  isCancelled: boolean;
  isSuspended: boolean;
  daysUntilExpiry: number;
  daysSinceStart: number;
  totalDurationDays: number;
  progressPercentage: number;
  formattedAmount: string;
  monthlyAmount: number;
  yearlyAmount: number;
}

// Subscription schema
const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    plan: {
      type: String,
      required: [true, 'Subscription plan is required'],
      enum: {
        values: ['free', 'pro', 'advanced'],
        message: 'Plan must be free, pro, or advanced',
      },
    },
    status: {
      type: String,
      required: [true, 'Subscription status is required'],
      enum: {
        values: ['active', 'expired', 'cancelled', 'suspended'],
        message: 'Status must be active, expired, cancelled, or suspended',
      },
      default: 'active',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (this: any, endDate: Date) {
          return endDate > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      maxlength: [100, 'Payment method cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'VND',
      enum: {
        values: ['VND', 'USD', 'EUR'],
        message: 'Currency must be VND, USD, or EUR',
      },
    },
    billingCycle: {
      type: String,
      required: [true, 'Billing cycle is required'],
      enum: {
        values: ['monthly', 'yearly'],
        message: 'Billing cycle must be monthly or yearly',
      },
    },
    nextBillingDate: {
      type: Date,
      validate: {
        validator: function (this: any, nextBillingDate: Date) {
          if (!nextBillingDate) return true;
          return nextBillingDate > this.startDate;
        },
        message: 'Next billing date must be after start date',
      },
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ userId: 1, status: 1 });

// Virtual for user
subscriptionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for cancelled by user
subscriptionSchema.virtual('cancelledByUser', {
  ref: 'User',
  localField: 'cancelledBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for is active
subscriptionSchema.virtual('isActive').get(function () {
  return this.status === 'active' && new Date() <= this.endDate;
});

// Virtual for is expired
subscriptionSchema.virtual('isExpired').get(function () {
  return new Date() > this.endDate;
});

// Virtual for is cancelled
subscriptionSchema.virtual('isCancelled').get(function () {
  return this.status === 'cancelled';
});

// Virtual for is suspended
subscriptionSchema.virtual('isSuspended').get(function () {
  return this.status === 'suspended';
});

// Virtual for days until expiry
subscriptionSchema.virtual('daysUntilExpiry').get(function () {
  if (this.isExpired || this.isCancelled) return 0;
  
  const now = new Date();
  const diff = this.endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for days since start
subscriptionSchema.virtual('daysSinceStart').get(function () {
  const now = new Date();
  const diff = now.getTime() - this.startDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual for total duration in days
subscriptionSchema.virtual('totalDurationDays').get(function () {
  const diff = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for progress percentage
subscriptionSchema.virtual('progressPercentage').get(function () {
  if (this.isExpired || this.isCancelled) return 100;
  
  const total = this.totalDurationDays;
  const elapsed = this.daysSinceStart;
  return Math.min(Math.round((elapsed / total) * 100), 100);
});

// Virtual for formatted amount
subscriptionSchema.virtual('formattedAmount').get(function () {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: this.currency,
  }).format(this.amount);
});

// Virtual for monthly equivalent amount
subscriptionSchema.virtual('monthlyAmount').get(function () {
  if (this.billingCycle === 'monthly') return this.amount;
  return Math.round(this.amount / 12);
});

// Virtual for yearly equivalent amount
subscriptionSchema.virtual('yearlyAmount').get(function () {
  if (this.billingCycle === 'yearly') return this.amount;
  return this.amount * 12;
});

// Pre-save middleware to calculate next billing date
subscriptionSchema.pre('save', function (next) {
  if (this.isNew && this.autoRenew && !this.nextBillingDate) {
    if (this.billingCycle === 'monthly') {
      this.nextBillingDate = new Date(this.startDate);
      this.nextBillingDate.setMonth(this.nextBillingDate.getMonth() + 1);
    } else if (this.billingCycle === 'yearly') {
      this.nextBillingDate = new Date(this.startDate);
      this.nextBillingDate.setFullYear(this.nextBillingDate.getFullYear() + 1);
    }
  }
  next();
});

// Pre-save middleware to validate dates
subscriptionSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.nextBillingDate && this.nextBillingDate <= this.startDate) {
    return next(new Error('Next billing date must be after start date'));
  }
  
  next();
});

// Static method to find by user
subscriptionSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId
) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to find active subscriptions
subscriptionSchema.statics.findActive = function () {
  const now = new Date();
  return this.find({
    status: 'active',
    endDate: { $gt: now },
  });
};

// Static method to find expired subscriptions
subscriptionSchema.statics.findExpired = function () {
  const now = new Date();
  return this.find({
    status: 'active',
    endDate: { $lte: now },
  });
};

// Static method to find by plan
subscriptionSchema.statics.findByPlan = function (plan: string) {
  return this.find({ plan, status: 'active' });
};

// Static method to find by status
subscriptionSchema.statics.findByStatus = function (status: string) {
  return this.find({ status });
};

// Static method to find expiring soon
subscriptionSchema.statics.findExpiringSoon = function (days: number = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $gte: now, $lte: futureDate },
  });
};

// Static method to get subscription statistics
subscriptionSchema.statics.getSubscriptionStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: '$plan',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        activeCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$status', 'active'] }, { $gt: ['$endDate', new Date()] }] },
              1,
              0,
            ],
          },
        },
        expiredCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$status', 'active'] }, { $lte: ['$endDate', new Date()] }] },
              1,
              0,
            ],
          },
        },
        cancelledCount: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Instance method to renew subscription
subscriptionSchema.methods.renew = async function () {
  if (!this.autoRenew) {
    throw new Error('Auto-renew is disabled for this subscription');
  }
  
  if (this.isActive) {
    throw new Error('Subscription is still active');
  }
  
  // Calculate new dates
  const now = new Date();
  this.startDate = now;
  
  if (this.billingCycle === 'monthly') {
    this.endDate = new Date(now);
    this.endDate.setMonth(now.getMonth() + 1);
  } else {
    this.endDate = new Date(now);
    this.endDate.setFullYear(now.getFullYear() + 1);
  }
  
  this.status = 'active';
  this.cancelledAt = undefined;
  this.cancellationReason = undefined;
  
  await this.save();
};

// Instance method to cancel subscription
subscriptionSchema.methods.cancel = async function (
  reason?: string,
  cancelledBy?: mongoose.Types.ObjectId
) {
  if (this.isCancelled) {
    throw new Error('Subscription is already cancelled');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  this.autoRenew = false;
  
  await this.save();
};

// Instance method to suspend subscription
subscriptionSchema.methods.suspend = async function () {
  if (this.isCancelled) {
    throw new Error('Cannot suspend cancelled subscription');
  }
  
  this.status = 'suspended';
  await this.save();
};

// Instance method to activate subscription
subscriptionSchema.methods.activate = async function () {
  if (this.isCancelled) {
    throw new Error('Cannot activate cancelled subscription');
  }
  
  this.status = 'active';
  await this.save();
};

// Export the model
export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
