import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';
import { IPayment } from '../payment/Payment';

// Revenue Distribution Interface
export interface IRevenueDistribution extends Document {
  distributionId: string; // Unique distribution ID (REV-YYYY-XXXXXX)
  
  // Transaction Details
  paymentId: Types.ObjectId | IPayment;
  courseId: Types.ObjectId | ICourse;
  instructorId: Types.ObjectId | IUser;
  studentId: Types.ObjectId | IUser;
  
  // Financial Breakdown
  totalAmount: number; // Total payment amount
  platformFee: number; // Platform commission (percentage)
  instructorRevenue: number; // Amount instructor receives
  platformRevenue: number; // Amount platform keeps
  processingFee: number; // Payment processor fee
  taxAmount: number; // Tax amount (if applicable)
  
  // Commission Structure
  commissionRate: number; // Platform commission rate (0-100%)
  commissionTier: 'standard' | 'premium' | 'enterprise' | 'custom';
  volumeBonus: number; // Volume-based bonus reduction
  loyaltyDiscount: number; // Instructor loyalty discount
  
  // Distribution Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed' | 'refunded';
  distributionDate: Date;
  settlementDate?: Date;
  payoutDate?: Date;
  
  // Payment Method & Destination
  payoutMethod: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto' | 'internal_wallet';
  payoutDestination: {
    accountType: string;
    accountNumber?: string;
    routingNumber?: string;
    paypalEmail?: string;
    cryptoAddress?: string;
    walletId?: string;
  };
  
  // Revenue Analytics
  analytics: {
    // Timing
    monthYear: string; // YYYY-MM format
    quarter: string; // Q1-Q4
    fiscalYear: number;
    
    // Performance
    isFirstPurchase: boolean;
    isRepeatCustomer: boolean;
    courseCategory: string;
    coursePriceRange: 'low' | 'medium' | 'high' | 'premium';
    
    // Marketing
    referralSource?: string;
    discountApplied?: number;
    couponCode?: string;
    affiliateCommission?: number;
    
    // Geography
    studentCountry?: string;
    instructorCountry?: string;
    taxJurisdiction?: string;
    
    // Platform Metrics
    revenueGrowth: number; // Month-over-month growth
    lifetimeValue: number; // Student's lifetime value
    instructorRank: number; // Instructor revenue ranking
  };
  
  // Reconciliation & Audit
  reconciliation: {
    bankStatementId?: string;
    paymentProcessorRef?: string;
    internalTransactionId?: string;
    reconciliationStatus: 'pending' | 'matched' | 'discrepancy' | 'resolved';
    reconciliationDate?: Date;
    discrepancyAmount?: number;
    discrepancyReason?: string;
  };
  
  // Compliance & Tax
  compliance: {
    taxWithheld: number;
    taxRate: number;
    taxJurisdiction: string;
    form1099Required: boolean;
    vatApplicable: boolean;
    vatAmount: number;
    complianceNotes?: string;
  };
  
  // Related Transactions
  relatedTransactions: {
    refundId?: Types.ObjectId;
    chargebackId?: Types.ObjectId;
    adjustmentId?: Types.ObjectId;
    parentDistributionId?: Types.ObjectId; // For split payments
    childDistributionIds?: Types.ObjectId[]; // For payment splits
  };
  
  // Dispute & Support
  dispute?: {
    disputeId: string;
    disputeReason: string;
    disputeAmount: number;
    disputeStatus: 'open' | 'under_review' | 'resolved' | 'escalated';
    disputeDate: Date;
    resolution?: string;
    resolutionDate?: Date;
  };
  
  // Notifications & Communications
  notifications: {
    instructorNotified: boolean;
    studentNotified: boolean;
    adminNotified: boolean;
    emailsSent: string[];
    lastNotificationDate?: Date;
  };
  
  // Metadata
  metadata: {
    currency: string;
    exchangeRate?: number;
    originalCurrency?: string;
    originalAmount?: number;
    processingTimeMs: number;
    apiVersion: string;
    webhookProcessed: boolean;
  };
  
  // Audit Trail
  auditLog: Array<{
    action: string;
    timestamp: Date;
    userId: Types.ObjectId;
    details: string;
    previousStatus?: string;
    newStatus?: string;
    amount?: number;
  }>;
}

// Revenue Distribution Schema
const revenueDistributionSchema = new Schema<IRevenueDistribution>({
  distributionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Transaction Details
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  instructorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Financial Breakdown
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  platformFee: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // Percentage
  },
  instructorRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  platformRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  processingFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // Commission Structure
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionTier: {
    type: String,
    enum: ['standard', 'premium', 'enterprise', 'custom'],
    required: true,
    default: 'standard'
  },
  volumeBonus: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Distribution Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'disputed', 'refunded'],
    required: true,
    default: 'pending',
    index: true
  },
  distributionDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  settlementDate: Date,
  payoutDate: Date,
  
  // Payment Method & Destination
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe', 'crypto', 'internal_wallet'],
    required: true,
    default: 'bank_transfer'
  },
  payoutDestination: {
    accountType: { type: String, required: true },
    accountNumber: String,
    routingNumber: String,
    paypalEmail: String,
    cryptoAddress: String,
    walletId: String
  },
  
  // Revenue Analytics
  analytics: {
    monthYear: { type: String, required: true, index: true },
    quarter: { type: String, required: true },
    fiscalYear: { type: Number, required: true, index: true },
    
    isFirstPurchase: { type: Boolean, required: true, default: false },
    isRepeatCustomer: { type: Boolean, required: true, default: false },
    courseCategory: { type: String, required: true },
    coursePriceRange: {
      type: String,
      enum: ['low', 'medium', 'high', 'premium'],
      required: true
    },
    
    referralSource: String,
    discountApplied: { type: Number, default: 0 },
    couponCode: String,
    affiliateCommission: { type: Number, default: 0 },
    
    studentCountry: String,
    instructorCountry: String,
    taxJurisdiction: String,
    
    revenueGrowth: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    instructorRank: { type: Number, default: 0 }
  },
  
  // Reconciliation & Audit
  reconciliation: {
    bankStatementId: String,
    paymentProcessorRef: String,
    internalTransactionId: String,
    reconciliationStatus: {
      type: String,
      enum: ['pending', 'matched', 'discrepancy', 'resolved'],
      default: 'pending'
    },
    reconciliationDate: Date,
    discrepancyAmount: Number,
    discrepancyReason: String
  },
  
  // Compliance & Tax
  compliance: {
    taxWithheld: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxJurisdiction: { type: String, default: 'US' },
    form1099Required: { type: Boolean, default: false },
    vatApplicable: { type: Boolean, default: false },
    vatAmount: { type: Number, default: 0 },
    complianceNotes: String
  },
  
  // Related Transactions
  relatedTransactions: {
    refundId: { type: Schema.Types.ObjectId, ref: 'Refund' },
    chargebackId: { type: Schema.Types.ObjectId, ref: 'Chargeback' },
    adjustmentId: { type: Schema.Types.ObjectId, ref: 'Adjustment' },
    parentDistributionId: { type: Schema.Types.ObjectId, ref: 'RevenueDistribution' },
    childDistributionIds: [{ type: Schema.Types.ObjectId, ref: 'RevenueDistribution' }]
  },
  
  // Dispute & Support
  dispute: {
    disputeId: String,
    disputeReason: String,
    disputeAmount: Number,
    disputeStatus: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'escalated']
    },
    disputeDate: Date,
    resolution: String,
    resolutionDate: Date
  },
  
  // Notifications & Communications
  notifications: {
    instructorNotified: { type: Boolean, default: false },
    studentNotified: { type: Boolean, default: false },
    adminNotified: { type: Boolean, default: false },
    emailsSent: [String],
    lastNotificationDate: Date
  },
  
  // Metadata
  metadata: {
    currency: { type: String, required: true, default: 'USD' },
    exchangeRate: Number,
    originalCurrency: String,
    originalAmount: Number,
    processingTimeMs: { type: Number, default: 0 },
    apiVersion: { type: String, required: true, default: '1.0' },
    webhookProcessed: { type: Boolean, default: false }
  },
  
  // Audit Trail
  auditLog: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, required: true },
    previousStatus: String,
    newStatus: String,
    amount: Number
  }]
}, {
  timestamps: true,
  collection: 'revenuedistributions'
});

// Indexes for performance
revenueDistributionSchema.index({ instructorId: 1, distributionDate: -1 });
revenueDistributionSchema.index({ courseId: 1, status: 1 });
revenueDistributionSchema.index({ status: 1, payoutDate: 1 });
revenueDistributionSchema.index({ 'analytics.monthYear': 1, instructorId: 1 });
revenueDistributionSchema.index({ 'analytics.fiscalYear': 1, 'analytics.quarter': 1 });
revenueDistributionSchema.index({ commissionTier: 1, commissionRate: 1 });

// Virtual Properties
revenueDistributionSchema.virtual('netInstructorAmount').get(function(this: IRevenueDistribution) {
  return this.instructorRevenue - this.taxAmount;
});

revenueDistributionSchema.virtual('effectiveCommissionRate').get(function(this: IRevenueDistribution) {
  const adjustedRate = this.commissionRate - this.volumeBonus - this.loyaltyDiscount;
  return Math.max(0, adjustedRate);
});

revenueDistributionSchema.virtual('isProfitable').get(function(this: IRevenueDistribution) {
  return this.platformRevenue > this.processingFee;
});

revenueDistributionSchema.virtual('isSettled').get(function(this: IRevenueDistribution) {
  return this.status === 'completed' && !!this.settlementDate;
});

revenueDistributionSchema.virtual('daysSinceDistribution').get(function(this: IRevenueDistribution) {
  return Math.floor((Date.now() - this.distributionDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Instance Methods
revenueDistributionSchema.methods.calculateCommission = function(baseAmount: number, instructorTier: string): number {
  let rate = this.commissionRate;
  
  // Apply tier-based adjustments
  switch (instructorTier) {
    case 'premium':
      rate = Math.max(rate - 5, 10); // 5% reduction, minimum 10%
      break;
    case 'enterprise':
      rate = Math.max(rate - 10, 5); // 10% reduction, minimum 5%
      break;
  }
  
  // Apply volume and loyalty bonuses
  rate = Math.max(rate - this.volumeBonus - this.loyaltyDiscount, 0);
  
  return Math.round((baseAmount * rate / 100) * 100) / 100;
};

revenueDistributionSchema.methods.processDistribution = async function(): Promise<void> {
  this.status = 'processing';
  this.addAuditLog('distribution_started', this.instructorId, 'Revenue distribution processing started');
  
  try {
    // Calculate amounts
    const platformFeeAmount = this.calculateCommission(this.totalAmount, 'standard');
    this.platformRevenue = platformFeeAmount;
    this.instructorRevenue = this.totalAmount - platformFeeAmount - this.processingFee - this.taxAmount;
    
    // Set settlement date (next business day)
    this.settlementDate = this.calculateNextBusinessDay();
    
    // Mark as completed
    this.status = 'completed';
    this.addAuditLog('distribution_completed', this.instructorId, 'Revenue distribution completed');
    
    await this.save();
  } catch (error) {
    this.status = 'failed';
    this.addAuditLog('distribution_failed', this.instructorId, `Distribution failed: ${error}`);
    throw error;
  }
};

revenueDistributionSchema.methods.addAuditLog = function(action: string, userId: Types.ObjectId, details: string, amount?: number): void {
  this.auditLog.push({
    action,
    timestamp: new Date(),
    userId,
    details,
    previousStatus: this.status,
    amount
  });
};

revenueDistributionSchema.methods.calculateNextBusinessDay = function(): Date {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Skip weekends
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
};

revenueDistributionSchema.methods.initiateDispute = function(reason: string, amount: number): void {
  this.dispute = {
    disputeId: `DISPUTE-${Date.now()}`,
    disputeReason: reason,
    disputeAmount: amount,
    disputeStatus: 'open',
    disputeDate: new Date()
  };
  
  this.status = 'disputed';
  this.addAuditLog('dispute_initiated', this.instructorId, `Dispute initiated: ${reason}`, amount);
};

// Static Methods
revenueDistributionSchema.statics.generateDistributionId = function(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `REV-${year}-${randomNum}`;
};

revenueDistributionSchema.statics.getInstructorRevenue = function(instructorId: Types.ObjectId, startDate?: Date, endDate?: Date) {
  const matchStage: any = { instructorId, status: 'completed' };
  
  if (startDate || endDate) {
    matchStage.distributionDate = {};
    if (startDate) matchStage.distributionDate.$gte = startDate;
    if (endDate) matchStage.distributionDate.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$instructorRevenue' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$totalAmount' },
        totalPlatformFees: { $sum: '$platformRevenue' },
        totalTaxes: { $sum: '$taxAmount' }
      }
    }
  ]);
};

revenueDistributionSchema.statics.getMonthlyRevenueReport = function(year: number, month?: number) {
  const matchStage: any = { 'analytics.fiscalYear': year, status: 'completed' };
  if (month) {
    const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
    matchStage['analytics.monthYear'] = monthYear;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$analytics.monthYear',
        totalRevenue: { $sum: '$totalAmount' },
        platformRevenue: { $sum: '$platformRevenue' },
        instructorRevenue: { $sum: '$instructorRevenue' },
        transactionCount: { $sum: 1 },
        uniqueInstructors: { $addToSet: '$instructorId' },
        uniqueStudents: { $addToSet: '$studentId' },
        averageCommissionRate: { $avg: '$commissionRate' }
      }
    },
    {
      $addFields: {
        uniqueInstructorCount: { $size: '$uniqueInstructors' },
        uniqueStudentCount: { $size: '$uniqueStudents' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

revenueDistributionSchema.statics.getTopInstructors = function(limit: number = 10, period?: string) {
  const matchStage: any = { status: 'completed' };
  if (period) matchStage['analytics.monthYear'] = period;
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$instructorId',
        totalRevenue: { $sum: '$instructorRevenue' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$totalAmount' },
        coursesCount: { $addToSet: '$courseId' }
      }
    },
    {
      $addFields: {
        coursesCount: { $size: '$coursesCount' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'instructor'
      }
    },
    { $unwind: '$instructor' },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        instructorName: { $concat: ['$instructor.firstName', ' ', '$instructor.lastName'] },
        instructorEmail: '$instructor.email',
        totalRevenue: 1,
        totalTransactions: 1,
        averageTransaction: 1,
        coursesCount: 1
      }
    }
  ]);
};

// Pre-save middleware
revenueDistributionSchema.pre('save', function(next) {
  if (this.isNew && !this.distributionId) {
    this.distributionId = (this.constructor as any).generateDistributionId();
  }
  
  // Set analytics data
  const date = this.distributionDate || new Date();
  this.analytics.monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  this.analytics.quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
  this.analytics.fiscalYear = date.getFullYear();
  
  next();
});

const RevenueDistribution = mongoose.model<IRevenueDistribution>('RevenueDistribution', revenueDistributionSchema);

export default RevenueDistribution;
