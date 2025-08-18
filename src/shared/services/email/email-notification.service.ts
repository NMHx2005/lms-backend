import mongoose from 'mongoose';
import { sendGridService } from './sendgrid.service';
import { EmailTemplatesService } from './email-templates.service';
import { EmailData, EmailType, TemplateVariables } from '../../types/email.types';
import User from '../../models/core/User';
import Course from '../../models/core/Course';
import Assignment from '../../models/core/Assignment';

export class EmailNotificationService {
  private static instance: EmailNotificationService;

  static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  // Send welcome email to new users
  async sendWelcomeEmail(userId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) {
        console.error('User not found or no email provided');
        return false;
      }

      const variables: TemplateVariables = {
        firstName: user.firstName,
        lastName: user.lastName,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email
      };

      const template = EmailTemplatesService.getTemplate('welcome', variables);

      const emailData: EmailData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        type: 'welcome',
        userId: userId,
        categories: ['welcome', 'onboarding']
      };

      return await sendGridService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  // Send course enrollment confirmation
  async sendCourseEnrollmentEmail(userId: mongoose.Types.ObjectId, courseId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const [user, course] = await Promise.all([
        User.findById(userId),
        Course.findById(courseId).populate('instructor', 'firstName lastName')
      ]);

      if (!user || !course || !user.email) {
        console.error('User or course not found');
        return false;
      }

      const variables: TemplateVariables = {
        firstName: user.firstName,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        courseName: course.title,
        courseUrl: `${process.env.APP_BASE_URL}/courses/${course._id}`,
        instructorName: course.instructorId ? `${(course.instructorId as any).firstName} ${(course.instructorId as any).lastName}` : 'N/A',
        enrollmentDate: new Date().toLocaleDateString('vi-VN')
      };

      const template = EmailTemplatesService.getTemplate('course_enrollment', variables);

      const emailData: EmailData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        type: 'course_enrollment',
        userId: userId,
        courseId: courseId,
        categories: ['course', 'enrollment']
      };

      return await sendGridService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending course enrollment email:', error);
      return false;
    }
  }

  // Send assignment due reminder
  async sendAssignmentDueReminder(userId: mongoose.Types.ObjectId, assignmentId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const [user, assignment] = await Promise.all([
        User.findById(userId),
        Assignment.findById(assignmentId).populate('courseId', 'title').populate('lessonId', 'title')
      ]);

      if (!user || !assignment || !user.email) {
        console.error('User or assignment not found');
        return false;
      }

      const variables: TemplateVariables = {
        firstName: user.firstName,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        assignmentTitle: assignment.title,
        assignmentUrl: `${process.env.APP_BASE_URL}/assignments/${assignment._id}`,
        courseName: (assignment.courseId as any)?.title || 'N/A',
        dueDate: assignment.dueDate?.toLocaleDateString('vi-VN') || 'Không xác định'
      };

      const template = EmailTemplatesService.getTemplate('assignment_due', variables);

      const emailData: EmailData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        type: 'assignment_due',
        userId: userId,
        courseId: assignment.courseId,
        categories: ['assignment', 'reminder']
      };

      return await sendGridService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending assignment due reminder:', error);
      return false;
    }
  }

  // Send grade notification
  async sendGradeAvailableEmail(userId: mongoose.Types.ObjectId, assignmentId: mongoose.Types.ObjectId, grade: number): Promise<boolean> {
    try {
      const [user, assignment] = await Promise.all([
        User.findById(userId),
        Assignment.findById(assignmentId).populate('courseId', 'title')
      ]);

      if (!user || !assignment || !user.email) {
        console.error('User or assignment not found');
        return false;
      }

      const variables: TemplateVariables = {
        firstName: user.firstName,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        assignmentTitle: assignment.title,
        assignmentUrl: `${process.env.APP_BASE_URL}/assignments/${assignment._id}`,
        courseName: (assignment.courseId as any)?.title || 'N/A',
        grade: grade,
        maxScore: assignment.maxScore
      };

      const template = EmailTemplatesService.getTemplate('grade_available', variables);

      const emailData: EmailData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        type: 'grade_available',
        userId: userId,
        courseId: assignment.courseId,
        categories: ['assignment', 'grade']
      };

      return await sendGridService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending grade available email:', error);
      return false;
    }
  }

  // Send payment confirmation
  async sendPaymentConfirmationEmail(userId: mongoose.Types.ObjectId, paymentData: { 
    orderId: string; 
    amount: number; 
    currency: string; 
    invoiceUrl?: string 
  }): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) {
        console.error('User not found or no email provided');
        return false;
      }

      const variables: TemplateVariables = {
        firstName: user.firstName,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentDate: new Date().toLocaleDateString('vi-VN'),
        invoiceUrl: paymentData.invoiceUrl || `${process.env.APP_BASE_URL}/invoices/${paymentData.orderId}`
      };

      const template = EmailTemplatesService.getTemplate('payment_confirmation', variables);

      const emailData: EmailData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        type: 'payment_confirmation',
        userId: userId,
        categories: ['payment', 'confirmation']
      };

      return await sendGridService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
      return false;
    }
  }

  // Send course completion email
  async sendCourseCompletionEmail(userId: mongoose.Types.ObjectId, courseId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const [user, course] = await Promise.all([
        User.findById(userId),
        Course.findById(courseId).populate('instructor', 'firstName lastName')
      ]);

      if (!user || !course || !user.email) {
        console.error('User or course not found');
        return false;
      }

      const variables: TemplateVariables = {
        firstName: user.firstName,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        courseName: course.title,
        courseUrl: `${process.env.APP_BASE_URL}/courses/${course._id}`,
        instructorName: course.instructorId ? `${(course.instructorId as any).firstName} ${(course.instructorId as any).lastName}` : 'N/A',
        completionDate: new Date().toLocaleDateString('vi-VN')
      };

      const template = EmailTemplatesService.getTemplate('course_completion', variables);

      const emailData: EmailData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        type: 'course_completion',
        userId: userId,
        courseId: courseId,
        categories: ['course', 'completion', 'certificate']
      };

      return await sendGridService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending course completion email:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.error('User not found for password reset');
        return false;
      }

      const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${resetToken}`;

      const variables: TemplateVariables & { resetUrl: string; resetToken: string } = {
        firstName: user.firstName,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        resetUrl: resetUrl,
        resetToken: resetToken
      };

      const template = EmailTemplatesService.getTemplate('password_reset', variables);

      const emailData: EmailData = {
        to: user.email,
        subject: template.subject,
        html: template.html,
        type: 'password_reset',
        userId: user._id,
        categories: ['security', 'password-reset']
      };

      return await sendGridService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  // Bulk send emails to multiple users
  async sendBulkEmails(userIds: mongoose.Types.ObjectId[], emailType: EmailType, variables: Partial<TemplateVariables>): Promise<{ success: number; failed: number }> {
    try {
      const users = await User.find({ _id: { $in: userIds } });
      
      const emailPromises = users.map(async (user) => {
        const userVariables: TemplateVariables = {
          firstName: user.firstName,
          lastName: user.lastName,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          ...variables
        };

        const template = EmailTemplatesService.getTemplate(emailType, userVariables);

        const emailData: EmailData = {
          to: user.email,
          subject: template.subject,
          html: template.html,
          type: emailType,
          userId: user._id,
          categories: ['bulk', emailType]
        };

        return sendGridService.sendEmail(emailData);
      });

      const results = await Promise.allSettled(emailPromises);
      
      const success = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - success;

      return { success, failed };
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      return { success: 0, failed: userIds.length };
    }
  }

  // Direct send email method
  async sendEmail(emailData: EmailData): Promise<boolean> {
    return await sendGridService.sendEmail(emailData);
  }

  // Check user email preferences before sending
  async canSendEmail(userId: mongoose.Types.ObjectId, emailType: EmailType): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.preferences?.notifications) {
        return true; // Default to allow if no preferences set
      }

      const notifications = user.preferences.notifications as any;

      switch (emailType) {
        case 'welcome':
        case 'password_reset':
        case 'email_verification':
          return true; // Always allow critical emails
        case 'course_enrollment':
        case 'course_completion':
        case 'course_update':
          return notifications.courseUpdates !== false;
        case 'assignment_due':
        case 'grade_available':
          return notifications.assignmentReminders !== false;
        case 'payment_confirmation':
        case 'billing_reminder':
          return notifications.achievementNotifications !== false; // Using this as billing preference
        case 'announcement':
          return notifications.email !== false;
        case 'weekly_digest':
          return notifications.weeklyDigest !== false;
        case 'monthly_report':
          return notifications.monthlyReport !== false;
        default:
          return notifications.email !== false;
      }
    } catch (error) {
      console.error('Error checking email preferences:', error);
      return true; // Default to allow on error
    }
  }
}

// Export singleton instance
export const emailNotificationService = EmailNotificationService.getInstance();
