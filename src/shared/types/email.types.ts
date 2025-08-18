import mongoose from 'mongoose';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  categories?: string[];
  userId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  type: EmailType;
  priority?: EmailPriority;
  scheduledAt?: Date;
  retryCount?: number;
}

export type EmailType = 
  | 'welcome'
  | 'course_enrollment' 
  | 'course_completion'
  | 'assignment_due'
  | 'grade_available'
  | 'payment_confirmation'
  | 'payment_failed'
  | 'password_reset'
  | 'email_verification'
  | 'course_update'
  | 'announcement'
  | 'weekly_digest'
  | 'monthly_report'
  | 'billing_reminder'
  | 'refund_processed';

export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface EmailQueueItem {
  id: string;
  emailData: EmailData;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  error?: string;
  createdAt: Date;
  sentAt?: Date;
}

export interface EmailStats {
  sent: number;
  failed: number;
  pending: number;
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
}

export interface TemplateVariables {
  // User variables
  userName?: string;
  userEmail?: string;
  firstName?: string;
  lastName?: string;
  
  // Course variables
  courseName?: string;
  courseUrl?: string;
  instructorName?: string;
  enrollmentDate?: string;
  completionDate?: string;
  progress?: number;
  
  // Assignment variables
  assignmentTitle?: string;
  assignmentUrl?: string;
  dueDate?: string;
  grade?: number;
  maxScore?: number;
  
  // Payment variables
  amount?: number;
  currency?: string;
  orderId?: string;
  invoiceUrl?: string;
  paymentDate?: string;
  
  // System variables
  siteName?: string;
  siteUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
  currentYear?: number;
  currentDate?: string;
}

export interface EmailPreferences {
  userId: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  courseUpdates: boolean;
  assignmentReminders: boolean;
  gradingNotifications: boolean;
  billingNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}
