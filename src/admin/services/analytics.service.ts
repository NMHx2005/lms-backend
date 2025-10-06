import { User, Course, Enrollment, Bill } from '../../shared/models';
import {
  DashboardAnalytics,
  UserAnalytics,
  CourseAnalytics,
  RevenueAnalytics,
  EnrollmentAnalytics
} from '../interfaces/analytics.interface';
import { ANALYTICS_DEFAULT_PERIOD } from '../constants/analytics.constants';

export class AnalyticsService {
  // Get dashboard analytics
  static async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      pendingCourses,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Bill.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Course.countDocuments({ isApproved: false }),
      User.countDocuments({
        lastActivityAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: revenue,
      pendingCourses,
      activeUsers,
      averageRevenue: totalEnrollments > 0 ? revenue / totalEnrollments : 0
    };
  }

  // Get user analytics
  static async getUserAnalytics(period: string = ANALYTICS_DEFAULT_PERIOD): Promise<UserAnalytics> {
    // Convert period to days
    let days: number;
    switch (period) {
      case 'daily':
        days = 1;
        break;
      case 'weekly':
        days = 7;
        break;
      case 'monthly':
        days = 30;
        break;
      case 'yearly':
        days = 365;
        break;
      default:
        days = Number(period) || 30;
    }
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      activeUsers,
      usersByRole
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({
        lastActivityAt: { $gte: startDate }
      }),
      User.aggregate([
        { $unwind: '$roles' },
        { $group: { _id: '$roles', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalUsers,
      newUsers,
      activeUsers,
      usersByRole,
      retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    };
  }

  // Get course analytics
  static async getCourseAnalytics(period: string = ANALYTICS_DEFAULT_PERIOD): Promise<CourseAnalytics> {
    // Convert period to days
    let days: number;
    switch (period) {
      case 'daily':
        days = 1;
        break;
      case 'weekly':
        days = 7;
        break;
      case 'monthly':
        days = 30;
        break;
      case 'yearly':
        days = 365;
        break;
      default:
        days = Number(period) || 30;
    }
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalCourses,
      publishedCourses,
      pendingCourses,
      coursesByDomain,
      averageRating
    ] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true, isApproved: true }),
      Course.countDocuments({ isApproved: false }),
      Course.aggregate([
        { $group: { _id: '$domain', count: { $sum: 1 } } }
      ]),
      Course.aggregate([
        { $match: { averageRating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$averageRating' } } }
      ])
    ]);

    return {
      totalCourses,
      publishedCourses,
      pendingCourses,
      coursesByDomain,
      averageRating: averageRating[0]?.avg || 0
    };
  }

  // Get revenue analytics
  static async getRevenueAnalytics(period: string = ANALYTICS_DEFAULT_PERIOD): Promise<RevenueAnalytics> {
    // Convert period to days
    let days: number;
    switch (period) {
      case 'daily':
        days = 1;
        break;
      case 'weekly':
        days = 7;
        break;
      case 'monthly':
        days = 30;
        break;
      case 'yearly':
        days = 365;
        break;
      default:
        days = Number(period) || 30;
    }
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalRevenue,
      monthlyRevenue,
      revenueByCourse,
      averageOrderValue
    ] = await Promise.all([
      Bill.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Bill.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Bill.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $group: { _id: '$courseId', courseName: { $first: '$course.title' }, revenue: { $sum: '$amount' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),
      Bill.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: null, avg: { $avg: '$amount' } } }
      ])
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        revenue: item.revenue
      })),
      revenueByCourse,
      averageOrderValue: averageOrderValue[0]?.avg || 0
    };
  }

  // Get enrollment analytics
  static async getEnrollmentAnalytics(period: string = ANALYTICS_DEFAULT_PERIOD): Promise<EnrollmentAnalytics> {
    // Convert period to days
    let days: number;
    switch (period) {
      case 'daily':
        days = 1;
        break;
      case 'weekly':
        days = 7;
        break;
      case 'monthly':
        days = 30;
        break;
      case 'yearly':
        days = 365;
        break;
      default:
        days = Number(period) || 30;
    }
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalEnrollments,
      newEnrollments,
      completionRate,
      enrollmentsByCourse
    ] = await Promise.all([
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ createdAt: { $gte: startDate } }),
      Enrollment.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }
      ]),
      Enrollment.aggregate([
        { $lookup: { from: 'courses', localField: 'courseId', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $group: { _id: '$courseId', courseName: { $first: '$course.title' }, enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: 10 }
      ])
    ]);

    const completionData = completionRate[0] || { total: 0, completed: 0 };

    return {
      totalEnrollments,
      newEnrollments,
      completionRate: completionData.total > 0 ? (completionData.completed / completionData.total) * 100 : 0,
      enrollmentsByCourse
    };
  }
}
