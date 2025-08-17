import { User, Course, Bill, RefundRequest } from '../../shared/models';
import { 
  SystemOverview, 
  SystemHealth, 
  RefundRequest as RefundRequestInterface,
  SystemLog,
  SystemSettings,
  BackupStatus,
  SystemQueryFilters
} from '../interfaces/system.interface';

export class SystemService {
  /**
   * Get system overview with key metrics
   */
  static async getSystemOverview(): Promise<SystemOverview> {
    try {
      const [
        totalUsers,
        totalCourses,
        totalRevenue,
        pendingRefunds,
        systemHealth
      ] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        Bill.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        RefundRequest.countDocuments({ status: 'pending' }),
        SystemService.checkSystemHealth()
      ]);

      const revenue = totalRevenue[0]?.total || 0;

      return {
        totalUsers,
        totalCourses,
        totalRevenue: revenue,
        pendingRefunds,
        systemHealth
      };
    } catch (error) {
      throw new Error('Failed to get system overview');
    }
  }

  /**
   * Check system health status
   */
  static async checkSystemHealth(): Promise<SystemHealth> {
    try {
      // In a real application, these would check actual system status
      const health: SystemHealth = {
        database: 'healthy',
        storage: 'healthy',
        email: 'healthy',
        payment: 'healthy'
      };

      // Check database connection
      try {
        await User.findOne().select('_id').lean();
        health.database = 'healthy';
      } catch (error) {
        health.database = 'error';
      }

      // Check storage (mock)
      health.storage = 'healthy';

      // Check email service (mock)
      health.email = 'healthy';

      // Check payment service (mock)
      health.payment = 'healthy';

      return health;
    } catch (error) {
      throw new Error('Failed to check system health');
    }
  }

  /**
   * Get pending refunds with pagination
   */
  static async getRefunds(filters: SystemQueryFilters): Promise<{
    refunds: RefundRequestInterface[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, status } = filters;
      
      const filter: any = {};
      if (status) filter.status = status;

      const skip = (Number(page) - 1) * Number(limit);
      
      const [refunds, total] = await Promise.all([
        RefundRequest.find(filter)
          .populate('studentId', 'name email')
          .populate('courseId', 'title')
          .populate('billId', 'amount')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 })
          .lean(),
        RefundRequest.countDocuments(filter)
      ]);

      // Map to interface
      const mappedRefunds: RefundRequestInterface[] = refunds.map(refund => ({
        _id: refund._id.toString(),
        studentId: {
          _id: (refund.studentId as any)._id.toString(),
          name: (refund.studentId as any).name,
          email: (refund.studentId as any).email
        },
        courseId: {
          _id: (refund.courseId as any)._id.toString(),
          title: (refund.courseId as any).title
        },
        billId: {
          _id: (refund.billId as any)._id.toString(),
          amount: (refund.billId as any).amount
        },
        status: refund.status as 'pending' | 'approved' | 'rejected',
        reason: refund.reason,
        adminNotes: refund.adminNotes,
        processedBy: refund.processedBy?.toString(),
        processedAt: refund.processedAt,
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt
      }));

      return {
        refunds: mappedRefunds,
        total,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      throw new Error('Failed to get refunds');
    }
  }

  /**
   * Process refund request
   */
  static async processRefund(
    refundId: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string,
    adminId?: string
  ): Promise<RefundRequestInterface> {
    try {
      const refund = await RefundRequest.findByIdAndUpdate(
        refundId,
        {
          status,
          adminNotes,
          processedBy: adminId,
          processedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('studentId', 'name email')
       .populate('courseId', 'title')
       .populate('billId', 'amount');

      if (!refund) {
        throw new Error('Refund request not found');
      }

      // Map to interface
      return {
        _id: refund._id.toString(),
        studentId: {
          _id: (refund.studentId as any)._id.toString(),
          name: (refund.studentId as any).name,
          email: (refund.studentId as any).email
        },
        courseId: {
          _id: (refund.courseId as any)._id.toString(),
          title: (refund.courseId as any).title
        },
        billId: {
          _id: (refund.billId as any)._id.toString(),
          amount: (refund.billId as any).amount
        },
        status: refund.status as 'pending' | 'approved' | 'rejected',
        reason: refund.reason,
        adminNotes: refund.adminNotes,
        processedBy: refund.processedBy?.toString(),
        processedAt: refund.processedAt,
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt
      };
    } catch (error) {
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get system logs (mock implementation)
   */
  static async getSystemLogs(filters: SystemQueryFilters): Promise<{
    logs: SystemLog[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10 } = filters;
      
      // Mock data - in real app this would query an audit log collection
      const mockLogs: SystemLog[] = [
        {
          id: '1',
          action: 'User Login',
          resource: 'Authentication',
          userId: 'user123',
          ipAddress: '192.168.1.1',
          severity: 'low',
          category: 'authentication',
          createdAt: new Date()
        }
      ];

      return {
        logs: mockLogs,
        total: 1,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 1,
          pages: 1
        }
      };
    } catch (error) {
      throw new Error('Failed to get system logs');
    }
  }

  /**
   * Get system settings
   */
  static async getSystemSettings(): Promise<SystemSettings> {
    try {
      // Mock data - in real app this would query a system settings collection
      const settings: SystemSettings = {
        siteName: 'LMS Platform',
        maintenanceMode: false,
        maxFileSize: 10485760, // 10MB
        allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        emailNotifications: true,
        paymentEnabled: true
      };

      return settings;
    } catch (error) {
      throw new Error('Failed to get system settings');
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      // In real app, this would update a system settings collection
      const currentSettings = await SystemService.getSystemSettings();
      
      const updatedSettings: SystemSettings = {
        ...currentSettings,
        ...updates
      };

      return updatedSettings;
    } catch (error) {
      throw new Error('Failed to update system settings');
    }
  }

  /**
   * Get backup status
   */
  static async getBackupStatus(): Promise<BackupStatus> {
    try {
      // Mock data - in real app this would check backup system status
      const backupStatus: BackupStatus = {
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        status: 'scheduled',
        size: '2.5 GB',
        type: 'full'
      };

      return backupStatus;
    } catch (error) {
      throw new Error('Failed to get backup status');
    }
  }
}
