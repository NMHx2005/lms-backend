import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import RevenueDistribution from '../../shared/models/core/RevenueDistribution';
import RevenueDistributionService from '../../shared/services/payments/revenue-distribution.service';
import Payment from '../../shared/models/payment/Payment';
import User from '../../shared/models/core/User';
import Course from '../../shared/models/core/Course';

/**
 * Get platform revenue overview
 */
export const getRevenueOverview = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { startDate, endDate, period = 'monthly' } = req.query;

  // Parse date filters
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate as string);
  if (endDate) dateFilter.$lte = new Date(endDate as string);

  // Get platform analytics
  const analytics = await RevenueDistributionService.getPlatformRevenueAnalytics(
    dateFilter.$gte,
    dateFilter.$lte
  );

  // Get growth metrics
  const growthMetrics = await RevenueDistribution.aggregate([
    {
      $match: {
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 && { distributionDate: dateFilter })
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$distributionDate' },
          month: { $month: '$distributionDate' }
        },
        totalRevenue: { $sum: '$totalAmount' },
        platformRevenue: { $sum: '$platformRevenue' },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Calculate period-over-period growth
  let growthRate = 0;
  if (growthMetrics.length >= 2) {
    const current = growthMetrics[growthMetrics.length - 1];
    const previous = growthMetrics[growthMetrics.length - 2];
    growthRate = ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100;
  }

  // Get commission distribution
  const commissionStats = await RevenueDistribution.aggregate([
    {
      $match: {
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 && { distributionDate: dateFilter })
      }
    },
    {
      $group: {
        _id: '$commissionTier',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageCommission: { $avg: '$commissionRate' },
        totalCommission: { $sum: '$platformRevenue' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: analytics.overview,
      growthMetrics,
      growthRate: Math.round(growthRate * 100) / 100,
      commissionStats,
      tierBreakdown: analytics.tierBreakdown,
      topCourses: analytics.topCourses
    }
  });
});

/**
 * Get detailed revenue analytics
 */
export const getRevenueAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { 
    startDate, 
    endDate, 
    groupBy = 'month', 
    courseId, 
    instructorId,
    tier 
  } = req.query;

  // Build match filter
  const matchFilter: any = { status: 'completed' };
  
  if (startDate || endDate) {
    matchFilter.distributionDate = {};
    if (startDate) matchFilter.distributionDate.$gte = new Date(startDate as string);
    if (endDate) matchFilter.distributionDate.$lte = new Date(endDate as string);
  }
  
  if (courseId) matchFilter.courseId = courseId;
  if (instructorId) matchFilter.instructorId = instructorId;
  if (tier) matchFilter.commissionTier = tier;

  // Define grouping stages
  const groupByStages: any = {
    day: {
      year: { $year: '$distributionDate' },
      month: { $month: '$distributionDate' },
      day: { $dayOfMonth: '$distributionDate' }
    },
    week: {
      year: { $year: '$distributionDate' },
      week: { $week: '$distributionDate' }
    },
    month: {
      year: { $year: '$distributionDate' },
      month: { $month: '$distributionDate' }
    },
    quarter: {
      year: { $year: '$distributionDate' },
      quarter: { $ceil: { $divide: [{ $month: '$distributionDate' }, 3] } }
    },
    year: {
      year: { $year: '$distributionDate' }
    }
  };

  // Revenue analytics pipeline
  const revenueData = await RevenueDistribution.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: groupByStages[groupBy as string] || groupByStages.month,
        totalRevenue: { $sum: '$totalAmount' },
        platformRevenue: { $sum: '$platformRevenue' },
        instructorRevenue: { $sum: '$instructorRevenue' },
        transactionCount: { $sum: 1 },
        averageTransaction: { $avg: '$totalAmount' },
        averageCommission: { $avg: '$commissionRate' },
        uniqueInstructors: { $addToSet: '$instructorId' },
        uniqueStudents: { $addToSet: '$studentId' },
        processingFees: { $sum: '$processingFee' },
        taxes: { $sum: '$taxAmount' }
      }
    },
    {
      $addFields: {
        uniqueInstructorCount: { $size: '$uniqueInstructors' },
        uniqueStudentCount: { $size: '$uniqueStudents' },
        netRevenue: { $subtract: ['$totalRevenue', '$processingFees'] },
        profitMargin: {
          $multiply: [
            { $divide: ['$platformRevenue', '$totalRevenue'] },
            100
          ]
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Course category breakdown
  const categoryBreakdown = await RevenueDistribution.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    {
      $group: {
        _id: '$course.category',
        totalRevenue: { $sum: '$totalAmount' },
        transactionCount: { $sum: 1 },
        averagePrice: { $avg: '$totalAmount' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Geographic distribution
  const geoDistribution = await RevenueDistribution.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$analytics.studentCountry',
        totalRevenue: { $sum: '$totalAmount' },
        transactionCount: { $sum: 1 },
        uniqueStudents: { $addToSet: '$studentId' }
      }
    },
    {
      $addFields: {
        uniqueStudentCount: { $size: '$uniqueStudents' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 20 }
  ]);

  res.json({
    success: true,
    data: {
      revenueData,
      categoryBreakdown,
      geoDistribution,
      summary: {
        totalRecords: revenueData.length,
        periodStart: startDate,
        periodEnd: endDate,
        groupBy
      }
    }
  });
});

/**
 * Get instructor revenue leaderboard
 */
export const getInstructorLeaderboard = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { 
    period = 'monthly', 
    limit = 20,
    startDate,
    endDate 
  } = req.query;

  // Build date filter
  const dateFilter: any = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
  } else {
    // Default to current month
    const now = new Date();
    dateFilter.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const leaderboard = await RevenueDistribution.aggregate([
    {
      $match: {
        status: 'completed',
        distributionDate: dateFilter
      }
    },
    {
      $group: {
        _id: '$instructorId',
        totalRevenue: { $sum: '$instructorRevenue' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$totalAmount' },
        totalPlatformFees: { $sum: '$platformRevenue' },
        uniqueCourses: { $addToSet: '$courseId' },
        uniqueStudents: { $addToSet: '$studentId' },
        averageCommissionRate: { $avg: '$commissionRate' },
        commissionTier: { $first: '$commissionTier' }
      }
    },
    {
      $addFields: {
        courseCount: { $size: '$uniqueCourses' },
        studentCount: { $size: '$uniqueStudents' },
        revenuePerCourse: { $divide: ['$totalRevenue', { $size: '$uniqueCourses' }] },
        revenuePerStudent: { $divide: ['$totalRevenue', { $size: '$uniqueStudents' }] }
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
    { $limit: parseInt(limit as string) },
    {
      $project: {
        instructorId: '$_id',
        instructorName: {
          $concat: ['$instructor.firstName', ' ', '$instructor.lastName']
        },
        instructorEmail: '$instructor.email',
        instructorAvatar: '$instructor.avatar',
        totalRevenue: 1,
        totalTransactions: 1,
        averageTransaction: 1,
        courseCount: 1,
        studentCount: 1,
        revenuePerCourse: 1,
        revenuePerStudent: 1,
        averageCommissionRate: 1,
        commissionTier: 1,
        rank: { $add: [{ $indexOfArray: [[], null] }, 1] }
      }
    }
  ]);

  // Add ranking
  leaderboard.forEach((instructor, index) => {
    instructor.rank = index + 1;
  });

  res.json({
    success: true,
    data: {
      leaderboard,
      period,
      totalInstructors: leaderboard.length
    }
  });
});

/**
 * Get commission tier analytics
 */
export const getCommissionTierAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { startDate, endDate } = req.query;

  const dateFilter: any = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
  }

  const tierAnalytics = await RevenueDistribution.aggregate([
    {
      $match: {
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 && { distributionDate: dateFilter })
      }
    },
    {
      $group: {
        _id: '$commissionTier',
        instructorCount: { $addToSet: '$instructorId' },
        totalRevenue: { $sum: '$totalAmount' },
        totalPlatformRevenue: { $sum: '$platformRevenue' },
        totalInstructorRevenue: { $sum: '$instructorRevenue' },
        transactionCount: { $sum: 1 },
        averageCommissionRate: { $avg: '$commissionRate' },
        averageTransaction: { $avg: '$totalAmount' },
        volumeBonusTotal: { $sum: '$volumeBonus' },
        loyaltyDiscountTotal: { $sum: '$loyaltyDiscount' }
      }
    },
    {
      $addFields: {
        instructorCount: { $size: '$instructorCount' },
        revenuePerInstructor: { $divide: ['$totalRevenue', { $size: '$instructorCount' }] },
        effectiveCommissionRate: {
          $divide: [
            { $multiply: ['$totalPlatformRevenue', 100] },
            '$totalRevenue'
          ]
        }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Calculate tier distribution percentages
  const totalRevenue = tierAnalytics.reduce((sum, tier) => sum + tier.totalRevenue, 0);
  tierAnalytics.forEach(tier => {
    tier.revenuePercentage = totalRevenue > 0 ? (tier.totalRevenue / totalRevenue) * 100 : 0;
  });

  // Get tier upgrade opportunities
  const upgradeOpportunities = await RevenueDistribution.aggregate([
    {
      $match: {
        status: 'completed',
        commissionTier: 'standard',
        ...(Object.keys(dateFilter).length > 0 && { distributionDate: dateFilter })
      }
    },
    {
      $group: {
        _id: '$instructorId',
        totalRevenue: { $sum: '$instructorRevenue' },
        transactionCount: { $sum: 1 },
        averageTransaction: { $avg: '$totalAmount' }
      }
    },
    {
      $match: {
        $or: [
          { totalRevenue: { $gte: 2000 } }, // Eligible for premium
          { totalRevenue: { $gte: 5000 } }  // Eligible for enterprise
        ]
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
    {
      $addFields: {
        suggestedTier: {
          $cond: [
            { $gte: ['$totalRevenue', 5000] },
            'enterprise',
            'premium'
          ]
        },
        potentialSavings: {
          $cond: [
            { $gte: ['$totalRevenue', 5000] },
            { $multiply: ['$totalRevenue', 0.10] }, // 10% savings for enterprise
            { $multiply: ['$totalRevenue', 0.05] }  // 5% savings for premium
          ]
        }
      }
    },
    { $sort: { potentialSavings: -1 } },
    { $limit: 20 }
  ]);

  res.json({
    success: true,
    data: {
      tierAnalytics,
      upgradeOpportunities,
      summary: {
        totalTiers: tierAnalytics.length,
        totalRevenue,
        averageCommissionRate: tierAnalytics.reduce((sum, tier) => 
          sum + tier.averageCommissionRate, 0) / tierAnalytics.length
      }
    }
  });
});

/**
 * Get payout analytics
 */
export const getPayoutAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { status, method, startDate, endDate } = req.query;

  const matchFilter: any = {};
  
  if (status) matchFilter.status = status;
  if (method) matchFilter.payoutMethod = method;
  
  if (startDate || endDate) {
    matchFilter.distributionDate = {};
    if (startDate) matchFilter.distributionDate.$gte = new Date(startDate as string);
    if (endDate) matchFilter.distributionDate.$lte = new Date(endDate as string);
  }

  // Payout status breakdown
  const statusBreakdown = await RevenueDistribution.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$instructorRevenue' },
        averageAmount: { $avg: '$instructorRevenue' }
      }
    }
  ]);

  // Payout method breakdown
  const methodBreakdown = await RevenueDistribution.aggregate([
    { $match: { ...matchFilter, status: 'completed' } },
    {
      $group: {
        _id: '$payoutMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$instructorRevenue' },
        averageProcessingTime: { $avg: '$metadata.processingTimeMs' }
      }
    }
  ]);

  // Pending payouts
  const pendingPayouts = await RevenueDistribution.aggregate([
    {
      $match: {
        status: 'completed',
        payoutDate: { $exists: false }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$instructorRevenue' },
        oldestPending: { $min: '$distributionDate' }
      }
    }
  ]);

  // Processing time analytics
  const processingTimes = await RevenueDistribution.aggregate([
    {
      $match: {
        status: 'completed',
        payoutDate: { $exists: true },
        ...(Object.keys(matchFilter).length > 0 && matchFilter)
      }
    },
    {
      $addFields: {
        processingDays: {
          $divide: [
            { $subtract: ['$payoutDate', '$distributionDate'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $group: {
        _id: '$payoutMethod',
        averageProcessingDays: { $avg: '$processingDays' },
        minProcessingDays: { $min: '$processingDays' },
        maxProcessingDays: { $max: '$processingDays' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      statusBreakdown,
      methodBreakdown,
      pendingPayouts: pendingPayouts[0] || { count: 0, totalAmount: 0 },
      processingTimes,
      summary: {
        totalPayouts: statusBreakdown.reduce((sum, item) => sum + item.count, 0),
        totalAmount: statusBreakdown.reduce((sum, item) => sum + item.totalAmount, 0)
      }
    }
  });
});

/**
 * Export revenue report
 */
export const exportRevenueReport = asyncHandler<AuthenticatedRequest>(async (req, res: Response) => {
  const { format = 'csv', startDate, endDate, type = 'summary' } = req.query;

  const dateFilter: any = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);
  }

  let reportData;

  if (type === 'detailed') {
    // Detailed transaction report
    reportData = await RevenueDistribution.find({
      status: 'completed',
      ...(Object.keys(dateFilter).length > 0 && { distributionDate: dateFilter })
    })
      .populate('instructorId', 'firstName lastName email')
      .populate('courseId', 'title category')
      .populate('studentId', 'firstName lastName email')
      .sort({ distributionDate: -1 });
  } else {
    // Summary report
    reportData = await RevenueDistribution.aggregate([
      {
        $match: {
          status: 'completed',
          ...(Object.keys(dateFilter).length > 0 && { distributionDate: dateFilter })
        }
      },
      {
        $group: {
          _id: '$analytics.monthYear',
          totalRevenue: { $sum: '$totalAmount' },
          platformRevenue: { $sum: '$platformRevenue' },
          instructorRevenue: { $sum: '$instructorRevenue' },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' },
          uniqueInstructors: { $addToSet: '$instructorId' },
          uniqueStudents: { $addToSet: '$studentId' }
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
  }

  if (format === 'csv') {
    let csvContent;
    
    if (type === 'detailed') {
      const csvHeaders = [
        'Distribution ID',
        'Date',
        'Instructor',
        'Course',
        'Student',
        'Total Amount',
        'Platform Revenue',
        'Instructor Revenue',
        'Commission Rate',
        'Status'
      ];
      
      const csvRows = reportData.map((record: any) => [
        record.distributionId,
        record.distributionDate.toISOString().split('T')[0],
        `${record.instructorId.firstName} ${record.instructorId.lastName}`,
        record.courseId.title,
        `${record.studentId.firstName} ${record.studentId.lastName}`,
        record.totalAmount,
        record.platformRevenue,
        record.instructorRevenue,
        record.commissionRate,
        record.status
      ]);
      
      csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    } else {
      const csvHeaders = [
        'Month',
        'Total Revenue',
        'Platform Revenue',
        'Instructor Revenue',
        'Transaction Count',
        'Average Transaction',
        'Unique Instructors',
        'Unique Students'
      ];
      
      const csvRows = reportData.map((record: any) => [
        record._id,
        record.totalRevenue,
        record.platformRevenue,
        record.instructorRevenue,
        record.transactionCount,
        record.averageTransaction,
        record.uniqueInstructorCount,
        record.uniqueStudentCount
      ]);
      
      csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${type}.csv`);
    res.send(csvContent);
  } else {
    res.json({
      success: true,
      data: {
        reportType: type,
        period: { startDate, endDate },
        records: reportData,
        exportedAt: new Date()
      }
    });
  }
});
