import { Types } from 'mongoose';
import RevenueDistribution, { IRevenueDistribution } from '../../models/core/RevenueDistribution';
import Payment, { IPayment } from '../../models/payment/Payment';
import Course, { ICourse } from '../../models/core/Course';
import User, { IUser } from '../../models/core/User';

export interface CommissionTierConfig {
  name: string;
  baseRate: number; // Base commission percentage
  volumeThresholds: {
    threshold: number; // Monthly revenue threshold
    reduction: number; // Commission reduction percentage
  }[];
  loyaltyBonuses: {
    monthsActive: number;
    reduction: number;
  }[];
}

export interface RevenueDistributionConfig {
  defaultCommissionRate: number;
  processingFeeRate: number;
  taxRates: {
    [country: string]: number;
  };
  commissionTiers: {
    [tier: string]: CommissionTierConfig;
  };
  payoutMethods: string[];
  settlementDays: number;
}

class RevenueDistributionService {
  private static instance: RevenueDistributionService;
  private config: RevenueDistributionConfig;

  private constructor() {
    this.config = {
      defaultCommissionRate: 30, // 30% platform commission
      processingFeeRate: 2.9, // 2.9% + $0.30 processing fee
      taxRates: {
        'US': 24, // US federal tax rate
        'UK': 20, // UK basic rate
        'EU': 19, // Average EU VAT
        'VN': 10  // Vietnam tax rate
      },
      commissionTiers: {
        standard: {
          name: 'Standard',
          baseRate: 30,
          volumeThresholds: [
            { threshold: 1000, reduction: 0 },
            { threshold: 5000, reduction: 2 },
            { threshold: 10000, reduction: 5 }
          ],
          loyaltyBonuses: [
            { monthsActive: 6, reduction: 1 },
            { monthsActive: 12, reduction: 2 },
            { monthsActive: 24, reduction: 3 }
          ]
        },
        premium: {
          name: 'Premium',
          baseRate: 25,
          volumeThresholds: [
            { threshold: 2000, reduction: 0 },
            { threshold: 10000, reduction: 3 },
            { threshold: 25000, reduction: 7 }
          ],
          loyaltyBonuses: [
            { monthsActive: 3, reduction: 1 },
            { monthsActive: 6, reduction: 2 },
            { monthsActive: 12, reduction: 4 }
          ]
        },
        enterprise: {
          name: 'Enterprise',
          baseRate: 20,
          volumeThresholds: [
            { threshold: 5000, reduction: 0 },
            { threshold: 25000, reduction: 5 },
            { threshold: 50000, reduction: 10 }
          ],
          loyaltyBonuses: [
            { monthsActive: 1, reduction: 1 },
            { monthsActive: 6, reduction: 3 },
            { monthsActive: 12, reduction: 5 }
          ]
        }
      },
      payoutMethods: ['bank_transfer', 'paypal', 'stripe'],
      settlementDays: 2 // Business days for settlement
    };
  }

  public static getInstance(): RevenueDistributionService {
    if (!RevenueDistributionService.instance) {
      RevenueDistributionService.instance = new RevenueDistributionService();
    }
    return RevenueDistributionService.instance;
  }

  /**
   * Process payment and create revenue distribution
   */
  async processPaymentDistribution(paymentId: Types.ObjectId): Promise<IRevenueDistribution> {
    try {
      // Get payment details
      const payment = await Payment.findById(paymentId)
        .populate('courseId')
        .populate('studentId');

      if (!payment) {
        throw new Error('Payment not found');
      }

      const course = (payment as any).courseId as ICourse;
      const student = (payment as any).studentId as IUser;

      // Get instructor details
      const instructor = await User.findById(course.instructorId);
      if (!instructor) {
        throw new Error('Instructor not found');
      }

      // Calculate commission and fees
      const distributionData = await this.calculateDistribution(
        payment.amount,
        instructor._id,
        course._id,
(student as any).profile?.country || 'US'
      );

      // Create revenue distribution record
      const revenueDistribution = new RevenueDistribution({
        paymentId: payment._id,
        courseId: course._id,
        instructorId: instructor._id,
        studentId: student._id,
        totalAmount: payment.amount,
        ...distributionData,
        payoutMethod: (instructor as any).payoutPreferences?.method || 'bank_transfer',
        payoutDestination: (instructor as any).payoutPreferences?.destination || {
          accountType: 'checking'
        },
        analytics: {
          isFirstPurchase: await this.isFirstPurchase(student._id),
          isRepeatCustomer: await this.isRepeatCustomer(student._id),
          courseCategory: (course as any).category || 'General',
          coursePriceRange: this.getPriceRange(payment.amount),
          referralSource: (payment as any).metadata?.referralSource,
          discountApplied: (payment as any).discountAmount || 0,
          couponCode: (payment as any).metadata?.couponCode,
          studentCountry: (student as any).profile?.country,
          instructorCountry: (instructor as any).profile?.country,
          lifetimeValue: await this.calculateLifetimeValue(student._id),
          instructorRank: await this.getInstructorRank(instructor._id)
        },
        compliance: {
          taxWithheld: distributionData.taxAmount,
          taxRate: this.config.taxRates[(instructor as any).profile?.country || 'US'] || 0,
          taxJurisdiction: (instructor as any).profile?.country || 'US',
          form1099Required: (instructor as any).profile?.country === 'US',
          vatApplicable: this.isVATApplicable((instructor as any).profile?.country),
          vatAmount: this.calculateVAT(payment.amount, (instructor as any).profile?.country)
        },
        metadata: {
          currency: payment.currency || 'USD',
          processingTimeMs: Date.now(),
          apiVersion: '1.0',
          webhookProcessed: false
        }
      });

      // Process the distribution
      await (revenueDistribution as any).processDistribution();

      // Update payment status
      (payment as any).revenueDistributed = true;
      (payment as any).distributionId = revenueDistribution._id;
      await payment.save();

      return revenueDistribution;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Calculate revenue distribution breakdown
   */
  private async calculateDistribution(
    totalAmount: number,
    instructorId: Types.ObjectId,
    courseId: Types.ObjectId,
    country: string
  ) {
    // Get instructor tier and volume data
    const instructorTier = await this.getInstructorTier(instructorId);
    const monthlyVolume = await this.getMonthlyVolume(instructorId);
    const loyaltyMonths = await this.getInstructorLoyaltyMonths(instructorId);

    // Calculate commission rate
    const tierConfig = this.config.commissionTiers[instructorTier];
    let commissionRate = tierConfig.baseRate;

    // Apply volume bonuses
    const volumeBonus = this.calculateVolumeBonus(monthlyVolume, tierConfig.volumeThresholds);
    const loyaltyDiscount = this.calculateLoyaltyDiscount(loyaltyMonths, tierConfig.loyaltyBonuses);

    commissionRate = Math.max(commissionRate - volumeBonus - loyaltyDiscount, 5); // Minimum 5%

    // Calculate processing fee
    const processingFee = Math.round((totalAmount * this.config.processingFeeRate / 100 + 0.30) * 100) / 100;

    // Calculate tax
    const taxRate = this.config.taxRates[country] || 0;
    const taxAmount = Math.round((totalAmount * taxRate / 100) * 100) / 100;

    // Calculate final distribution
    const platformRevenue = Math.round((totalAmount * commissionRate / 100) * 100) / 100;
    const instructorRevenue = totalAmount - platformRevenue - processingFee - taxAmount;

    return {
      platformFee: commissionRate,
      instructorRevenue: Math.max(0, instructorRevenue),
      platformRevenue,
      processingFee,
      taxAmount,
      commissionRate,
      commissionTier: instructorTier,
      volumeBonus,
      loyaltyDiscount
    };
  }

  /**
   * Get instructor tier based on performance
   */
  private async getInstructorTier(instructorId: Types.ObjectId): Promise<string> {
    const instructor = await User.findById(instructorId);
    return (instructor as any)?.subscriptionTier || 'standard';
  }

  /**
   * Get instructor's monthly revenue volume
   */
  private async getMonthlyVolume(instructorId: Types.ObjectId): Promise<number> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const result = await RevenueDistribution.aggregate([
      {
        $match: {
          instructorId,
          distributionDate: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$instructorRevenue' }
        }
      }
    ]);

    return result[0]?.totalRevenue || 0;
  }

  /**
   * Get instructor loyalty months
   */
  private async getInstructorLoyaltyMonths(instructorId: Types.ObjectId): Promise<number> {
    const instructor = await User.findById(instructorId);
    if (!instructor) return 0;

    const monthsSinceCreation = Math.floor(
      (Date.now() - instructor.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    return monthsSinceCreation;
  }

  /**
   * Calculate volume bonus
   */
  private calculateVolumeBonus(volume: number, thresholds: { threshold: number; reduction: number }[]): number {
    let bonus = 0;
    
    for (const threshold of thresholds.sort((a, b) => b.threshold - a.threshold)) {
      if (volume >= threshold.threshold) {
        bonus = threshold.reduction;
        break;
      }
    }
    
    return bonus;
  }

  /**
   * Calculate loyalty discount
   */
  private calculateLoyaltyDiscount(months: number, bonuses: { monthsActive: number; reduction: number }[]): number {
    let discount = 0;
    
    for (const bonus of bonuses.sort((a, b) => b.monthsActive - a.monthsActive)) {
      if (months >= bonus.monthsActive) {
        discount = bonus.reduction;
        break;
      }
    }
    
    return discount;
  }

  /**
   * Check if this is student's first purchase
   */
  private async isFirstPurchase(studentId: Types.ObjectId): Promise<boolean> {
    const paymentCount = await Payment.countDocuments({
      studentId,
      status: 'completed'
    });
    
    return paymentCount === 1;
  }

  /**
   * Check if student is repeat customer
   */
  private async isRepeatCustomer(studentId: Types.ObjectId): Promise<boolean> {
    const paymentCount = await Payment.countDocuments({
      studentId,
      status: 'completed'
    });
    
    return paymentCount > 1;
  }

  /**
   * Get price range category
   */
  private getPriceRange(amount: number): 'low' | 'medium' | 'high' | 'premium' {
    if (amount < 50) return 'low';
    if (amount < 150) return 'medium';
    if (amount < 500) return 'high';
    return 'premium';
  }

  /**
   * Calculate student's lifetime value
   */
  private async calculateLifetimeValue(studentId: Types.ObjectId): Promise<number> {
    const result = await Payment.aggregate([
      {
        $match: {
          studentId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$amount' }
        }
      }
    ]);

    return result[0]?.totalValue || 0;
  }

  /**
   * Get instructor revenue ranking
   */
  private async getInstructorRank(instructorId: Types.ObjectId): Promise<number> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const rankings = await RevenueDistribution.aggregate([
      {
        $match: {
          distributionDate: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$instructorId',
          totalRevenue: { $sum: '$instructorRevenue' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const rank = rankings.findIndex(r => r._id.toString() === instructorId.toString()) + 1;
    return rank || rankings.length + 1;
  }

  /**
   * Check if VAT is applicable
   */
  private isVATApplicable(country?: string): boolean {
    const vatCountries = ['UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK'];
    return vatCountries.includes(country || '');
  }

  /**
   * Calculate VAT amount
   */
  private calculateVAT(amount: number, country?: string): number {
    if (!this.isVATApplicable(country)) return 0;
    
    const vatRates: { [key: string]: number } = {
      'UK': 20,
      'DE': 19,
      'FR': 20,
      'IT': 22,
      'ES': 21
    };
    
    const vatRate = vatRates[country || ''] || 20;
    return Math.round((amount * vatRate / 100) * 100) / 100;
  }

  /**
   * Get revenue summary for instructor
   */
  async getInstructorRevenueSummary(
    instructorId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ) {
    const matchStage: any = { instructorId, status: 'completed' };
    
    if (startDate || endDate) {
      matchStage.distributionDate = {};
      if (startDate) matchStage.distributionDate.$gte = startDate;
      if (endDate) matchStage.distributionDate.$lte = endDate;
    }

    const summary = await RevenueDistribution.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$instructorRevenue' },
          totalPlatformFees: { $sum: '$platformRevenue' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          totalTaxes: { $sum: '$taxAmount' },
          averageCommissionRate: { $avg: '$commissionRate' }
        }
      }
    ]);

    // Get monthly breakdown
    const monthlyBreakdown = await RevenueDistribution.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$analytics.monthYear',
          revenue: { $sum: '$instructorRevenue' },
          transactions: { $sum: 1 },
          averageCommission: { $avg: '$commissionRate' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      summary: summary[0] || {
        totalRevenue: 0,
        totalPlatformFees: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        totalTaxes: 0,
        averageCommissionRate: 0
      },
      monthlyBreakdown
    };
  }

  /**
   * Get platform revenue analytics
   */
  async getPlatformRevenueAnalytics(startDate?: Date, endDate?: Date) {
    const matchStage: any = { status: 'completed' };
    
    if (startDate || endDate) {
      matchStage.distributionDate = {};
      if (startDate) matchStage.distributionDate.$gte = startDate;
      if (endDate) matchStage.distributionDate.$lte = endDate;
    }

    // Overall metrics
    const overview = await RevenueDistribution.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          platformRevenue: { $sum: '$platformRevenue' },
          instructorRevenue: { $sum: '$instructorRevenue' },
          totalTransactions: { $sum: 1 },
          uniqueInstructors: { $addToSet: '$instructorId' },
          uniqueStudents: { $addToSet: '$studentId' },
          averageTransactionSize: { $avg: '$totalAmount' },
          averageCommissionRate: { $avg: '$commissionRate' }
        }
      },
      {
        $addFields: {
          uniqueInstructorCount: { $size: '$uniqueInstructors' },
          uniqueStudentCount: { $size: '$uniqueStudents' },
          platformMargin: {
            $multiply: [
              { $divide: ['$platformRevenue', '$totalRevenue'] },
              100
            ]
          }
        }
      }
    ]);

    // Commission tier breakdown
    const tierBreakdown = await RevenueDistribution.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$commissionTier',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageCommission: { $avg: '$commissionRate' }
        }
      }
    ]);

    // Top performing courses
    const topCourses = await RevenueDistribution.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$courseId',
          totalRevenue: { $sum: '$totalAmount' },
          transactionCount: { $sum: 1 },
          averagePrice: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    return {
      overview: overview[0] || {},
      tierBreakdown,
      topCourses
    };
  }

  /**
   * Process pending payouts
   */
  async processPendingPayouts(): Promise<void> {
    const pendingDistributions = await RevenueDistribution.find({
      status: 'completed',
      payoutDate: { $exists: false },
      settlementDate: { $lte: new Date() }
    });

    for (const distribution of pendingDistributions) {
      try {
        await this.processInstructorPayout(distribution);
      } catch (error) {

      }
    }
  }

  /**
   * Process individual instructor payout
   */
  private async processInstructorPayout(distribution: IRevenueDistribution): Promise<void> {
    // In a real implementation, this would integrate with payment processors
    // For now, we'll simulate the payout process
    
    distribution.payoutDate = new Date();
    (distribution as any).auditLog.push({
      action: 'payout_processed',
      timestamp: new Date(),
      userId: distribution.instructorId,
      userRole: 'instructor',
      details: `Payout of $${distribution.instructorRevenue} processed via ${distribution.payoutMethod}`
    });

    // Update notification status
    distribution.notifications.instructorNotified = true;
    distribution.notifications.lastNotificationDate = new Date();

    await distribution.save();
  }
}

export default RevenueDistributionService.getInstance();
