import mongoose from 'mongoose';
import cron from 'node-cron';
import Announcement, { IAnnouncement } from '../../models/communication/Announcement';
import { webSocketService } from '../websocket/websocket.service';
import { emailNotificationService } from '../email/email-notification.service';
import User from '../../models/core/User';
import Course from '../../models/core/Course';
import Enrollment from '../../models/core/Enrollment';

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: 'general' | 'course' | 'urgent' | 'maintenance' | 'update';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  target: {
    type: 'all' | 'role' | 'course' | 'user';
    value?: string | string[];
  };
  isScheduled?: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  attachments?: {
    type: 'image' | 'video' | 'document';
    url: string;
    filename: string;
    size: number;
  }[];
  displayOptions?: {
    showAsPopup?: boolean;
    showOnDashboard?: boolean;
    sendEmail?: boolean;
    sendPush?: boolean;
    requireAcknowledgment?: boolean;
  };
  tags?: string[];
  createdBy: {
    userId: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };
}

export interface AnnouncementFilter {
  status?: string[];
  type?: string[];
  priority?: string[];
  targetType?: string[];
  createdBy?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export class AnnouncementService {
  private static instance: AnnouncementService;
  private schedulerInitialized = false;

  static getInstance(): AnnouncementService {
    if (!AnnouncementService.instance) {
      AnnouncementService.instance = new AnnouncementService();
    }
    return AnnouncementService.instance;
  }

  constructor() {
    // Defer scheduler initialization until DB connection is ready
  }

  // Public initializer to be called after DB connects
  public initializeSchedulers(): void {
    this.initializeScheduler();
  }

  // Initialize the scheduler for automated tasks
  private initializeScheduler(): void {
    if (this.schedulerInitialized) return;

    // Check for scheduled announcements every minute
    cron.schedule('* * * * *', async () => {
      if (mongoose.connection.readyState !== 1) return; // skip if not connected
      await this.processScheduledAnnouncements();
    });

    // Expire old announcements every hour
    cron.schedule('0 * * * *', async () => {
      if (mongoose.connection.readyState !== 1) return; // skip if not connected
      await this.expireOldAnnouncements();
    });

    // Send expiry reminders daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      if (mongoose.connection.readyState !== 1) return; // skip if not connected
      await this.sendExpiryReminders();
    });

    this.schedulerInitialized = true;
    console.log('📅 Announcement scheduler initialized');
  }

  // Create new announcement
  async createAnnouncement(data: CreateAnnouncementData): Promise<IAnnouncement> {
    try {
      const announcement = new Announcement({
        ...data,
        status: data.isScheduled ? 'scheduled' : 'draft',
        displayOptions: {
          showAsPopup: false,
          showOnDashboard: true,
          sendEmail: true,
          sendPush: true,
          requireAcknowledgment: false,
          ...data.displayOptions
        }
      });

      await announcement.save();
      console.log(`📢 Announcement created: ${announcement.title}`);

      return announcement;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  // Update announcement
  async updateAnnouncement(
    id: string,
    data: Partial<CreateAnnouncementData> & { updatedBy: { userId: mongoose.Types.ObjectId; name: string; role: string } }
  ): Promise<IAnnouncement | null> {
    try {
      const announcement = await Announcement.findById(id);
      if (!announcement) return null;

      // Don't allow editing published announcements (except for expiry and display options)
      if (announcement.status === 'published') {
        const allowedFields = ['expiresAt', 'displayOptions', 'tags', 'updatedBy'];
        const updateData: any = {};
        Object.keys(data).forEach(key => {
          if (allowedFields.includes(key)) {
            updateData[key] = (data as any)[key];
          }
        });

        Object.assign(announcement, updateData);
      } else {
        Object.assign(announcement, data);
      }

      await announcement.save();
      console.log(`📝 Announcement updated: ${announcement.title}`);

      return announcement;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  // Delete announcement
  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      const result = await Announcement.findByIdAndDelete(id);
      if (result) {
        console.log(`🗑️ Announcement deleted: ${result.title}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }
  }

  // Get announcement by ID
  async getAnnouncementById(id: string): Promise<IAnnouncement | null> {
    try {
      return await Announcement.findById(id);
    } catch (error) {
      console.error('Error getting announcement:', error);
      return null;
    }
  }

  // Get announcements with filtering and pagination
  async getAnnouncements(
    filter: AnnouncementFilter = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'publishedAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ announcements: IAnnouncement[]; total: number; page: number; pages: number }> {
    try {
      const query = this.buildQuery(filter);
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [announcements, total] = await Promise.all([
        Announcement.find(query)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit),
        Announcement.countDocuments(query)
      ]);

      return {
        announcements,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  }

  // Get announcements for specific user
  async getAnnouncementsForUser(
    userId: string,
    userRole: string,
    enrolledCourses: string[] = [],
    page: number = 1,
    limit: number = 20
  ): Promise<{ announcements: IAnnouncement[]; total: number }> {
    try {
      const query = {
        status: 'published',
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ],
        $and: [
          {
            $or: [
              { 'target.type': 'all' },
              { 'target.type': 'role', 'target.value': userRole },
              { 'target.type': 'course', 'target.value': { $in: enrolledCourses } },
              { 'target.type': 'user', 'target.value': { $in: [userId] } }
            ]
          }
        ]
      };

      const [announcements, total] = await Promise.all([
        Announcement.find(query)
          .sort({ priority: 1, publishedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Announcement.countDocuments(query)
      ]);

      return { announcements, total };
    } catch (error) {
      console.error('Error getting user announcements:', error);
      throw error;
    }
  }

  // Publish announcement immediately
  async publishAnnouncement(id: string): Promise<IAnnouncement | null> {
    try {
      const announcement = await Announcement.findById(id);
      if (!announcement) return null;

      if (announcement.status !== 'draft' && announcement.status !== 'scheduled') {
        throw new Error('Only draft or scheduled announcements can be published');
      }

      announcement.status = 'published';
      await announcement.save();

      // Send notifications
      await this.sendAnnouncementNotifications(announcement);

      console.log(`📢 Announcement published: ${announcement.title}`);
      return announcement;
    } catch (error) {
      console.error('Error publishing announcement:', error);
      throw error;
    }
  }

  // Cancel announcement
  async cancelAnnouncement(id: string): Promise<IAnnouncement | null> {
    try {
      const announcement = await Announcement.findById(id);
      if (!announcement) return null;

      announcement.status = 'cancelled';
      await announcement.save();
      console.log(`❌ Announcement cancelled: ${announcement.title}`);

      return announcement;
    } catch (error) {
      console.error('Error cancelling announcement:', error);
      throw error;
    }
  }

  // Acknowledge announcement
  async acknowledgeAnnouncement(announcementId: string, userId: string): Promise<boolean> {
    try {
      const announcement = await Announcement.findById(announcementId);
      if (!announcement || !announcement.displayOptions.requireAcknowledgment) {
        return false;
      }

      if (!announcement.acknowledgedBy) {
        announcement.acknowledgedBy = [];
      }

      announcement.acknowledgedBy.push({
        userId: new mongoose.Types.ObjectId(userId),
        acknowledgedAt: new Date()
      });
      await announcement.save();
      console.log(`✅ Announcement acknowledged by user ${userId}`);

      return true;
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
      return false;
    }
  }

  // Track announcement view
  async trackAnnouncementView(id: string): Promise<boolean> {
    try {
      const announcement = await Announcement.findById(id);
      if (!announcement) return false;

      announcement.analytics.totalViews++;
      await announcement.save();
      return true;
    } catch (error) {
      console.error('Error tracking announcement view:', error);
      return false;
    }
  }

  // Track announcement click
  async trackAnnouncementClick(id: string): Promise<boolean> {
    try {
      const announcement = await Announcement.findById(id);
      if (!announcement) return false;

      announcement.analytics.totalClicks++;
      await announcement.save();
      return true;
    } catch (error) {
      console.error('Error tracking announcement click:', error);
      return false;
    }
  }

  // Get announcement analytics
  async getAnnouncementAnalytics(id: string): Promise<any> {
    try {
      const announcement = await Announcement.findById(id);
      if (!announcement) return null;

      return {
        id: announcement._id,
        title: announcement.title,
        analytics: announcement.analytics,
        acknowledgmentRate: announcement.analytics.totalAcknowledgments / announcement.analytics.totalViews,
        timeUntilExpiry: announcement.expiresAt ? Math.ceil((announcement.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
        acknowledgedBy: announcement.acknowledgedBy?.length || 0,
        totalTargetUsers: await this.calculateTargetUserCount(announcement)
      };
    } catch (error) {
      console.error('Error getting announcement analytics:', error);
      return null;
    }
  }

  // Process scheduled announcements
  private async processScheduledAnnouncements(): Promise<void> {
    try {
      const scheduledAnnouncements = await Announcement.find({
        status: 'scheduled',
        scheduledAt: { $lte: new Date() }
      });

      for (const announcement of scheduledAnnouncements) {
        announcement.status = 'published';
        await announcement.save();
        await this.sendAnnouncementNotifications(announcement);
        console.log(`⏰ Scheduled announcement published: ${announcement.title}`);
      }
    } catch (error) {
      console.error('Error processing scheduled announcements:', error);
    }
  }

  // Expire old announcements
  private async expireOldAnnouncements(): Promise<void> {
    try {
      const result = await Announcement.updateMany(
        {
          expiresAt: { $lt: new Date() },
          status: 'published'
        },
        { status: 'expired' }
      );

      if (result.modifiedCount > 0) {
        console.log(`⏳ Expired ${result.modifiedCount} announcements`);
      }
    } catch (error) {
      console.error('Error expiring announcements:', error);
    }
  }

  // Send expiry reminders
  private async sendExpiryReminders(): Promise<void> {
    try {
      const expiringAnnouncements = await Announcement.find({
        expiresAt: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        status: 'published'
      });

      for (const announcement of expiringAnnouncements) {
        // Notify admin about expiring announcement
        const adminUsers = await User.find({ role: 'admin' });

        for (const admin of adminUsers) {
          webSocketService.sendToUser(admin._id.toString(), {
            type: 'warning',
            title: 'Thông báo sắp hết hạn',
            message: `Thông báo "${announcement.title}" sẽ hết hạn trong 24 giờ`,
            actionUrl: `/admin/announcements/${announcement._id}`,
            priority: 'normal'
          });
        }
      }
    } catch (error) {
      console.error('Error sending expiry reminders:', error);
    }
  }

  // Send announcement notifications
  private async sendAnnouncementNotifications(announcement: IAnnouncement): Promise<void> {
    try {
      // Send WebSocket notification
      if (announcement.displayOptions.sendPush) {
        const announcementData = {
          id: announcement._id.toString(),
          title: announcement.title,
          content: announcement.content,
          type: announcement.type as 'general' | 'course' | 'urgent',
          target: announcement.target,
          createdBy: {
            id: announcement.createdBy.userId.toString(),
            name: announcement.createdBy.name,
            role: announcement.createdBy.role
          },
          createdAt: announcement.createdAt,
          expiresAt: announcement.expiresAt
        };

        webSocketService.sendAnnouncement(announcementData);
      }

      // Send email notifications
      if (announcement.displayOptions.sendEmail) {
        await this.sendAnnouncementEmails(announcement);
      }
    } catch (error) {
      console.error('Error sending announcement notifications:', error);
    }
  }

  // Send announcement emails
  private async sendAnnouncementEmails(announcement: IAnnouncement): Promise<void> {
    try {
      const targetUsers = await this.getTargetUsers(announcement);

      const emailPromises = targetUsers.map(async (user) => {
        const canSend = await emailNotificationService.canSendEmail(user._id, 'announcement');
        if (!canSend) return false;

        // Create email content
        const emailData = {
          to: user.email,
          subject: `📢 ${announcement.title}`,
          html: `
            <h2>${announcement.title}</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              ${announcement.content.replace(/\n/g, '<br>')}
            </div>
            ${announcement.attachments?.length ?
              `<h3>Tệp đính kèm:</h3>
               <ul>
                 ${announcement.attachments.map(att =>
                `<li><a href="${att.url}">${att.filename}</a></li>`
              ).join('')}
               </ul>` : ''
            }
            <hr>
            <p style="color: #666; font-size: 12px;">
              Thông báo từ ${announcement.createdBy.name} (${announcement.createdBy.role})<br>
              Hệ thống LMS
            </p>
          `
        } as const;

        return emailNotificationService.sendEmail({
          type: 'announcement',
          priority: 'normal',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html
        });
      });

      await Promise.allSettled(emailPromises);
    } catch (error) {
      console.error('Error sending announcement emails:', error);
    }
  }

  // Helper: get target users
  private async getTargetUsers(announcement: IAnnouncement): Promise<Array<{ _id: any; email: string }>> {
    const target = announcement.target;

    if (target.type === 'all') {
      const users = await User.find({}, 'email');
      return users as any;
    }

    if (target.type === 'role') {
      const users = await User.find({ role: target.value }, 'email');
      return users as any;
    }

    if (target.type === 'course') {
      const courseIds = Array.isArray(target.value) ? target.value : [target.value];
      const enrollments = await Enrollment.find({ courseId: { $in: courseIds } }, 'studentId').lean();
      const userIds = enrollments.map((e) => e.studentId);
      const users = await User.find({ _id: { $in: userIds } }, 'email');
      return users as any;
    }

    if (target.type === 'user') {
      const ids = Array.isArray(target.value) ? target.value : [target.value];
      const users = await User.find({ _id: { $in: ids } }, 'email');
      return users as any;
    }

    return [];
  }

  // Calculate target user count
  private async calculateTargetUserCount(announcement: IAnnouncement): Promise<number> {
    const targetUsers = await this.getTargetUsers(announcement);
    return targetUsers.length;
  }

  // Get total count of announcements
  async getAnnouncementCount(): Promise<number> {
    return Announcement.countDocuments({});
  }

  // Get all announcements (no pagination)
  async getAllAnnouncements(): Promise<IAnnouncement[]> {
    return Announcement.find({});
  }

  // Build query for admin listing
  private buildQuery(filter: AnnouncementFilter): any {
    const query: any = {};

    if (filter.status?.length) {
      query.status = { $in: filter.status };
    }
    if (filter.type?.length) {
      query.type = { $in: filter.type };
    }
    if (filter.priority?.length) {
      query.priority = { $in: filter.priority };
    }
    if (filter.targetType?.length) {
      query['target.type'] = { $in: filter.targetType };
    }
    if (filter.createdBy) {
      query['createdBy.userId'] = filter.createdBy;
    }
    if (filter.tags?.length) {
      query.tags = { $in: filter.tags };
    }
    if (filter.dateRange?.start && filter.dateRange?.end) {
      query.createdAt = {
        $gte: filter.dateRange.start,
        $lte: filter.dateRange.end
      };
    }
    if (filter.searchTerm) {
      query.$or = [
        { title: { $regex: filter.searchTerm, $options: 'i' } },
        { content: { $regex: filter.searchTerm, $options: 'i' } },
        { tags: { $in: [filter.searchTerm] } }
      ];
    }

    return query;
  }
}

// Export singleton instance
export const announcementService = AnnouncementService.getInstance();
