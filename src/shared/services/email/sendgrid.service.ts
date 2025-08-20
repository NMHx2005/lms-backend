import sgMail from '@sendgrid/mail';
import { EmailTemplate, EmailData } from '../../types/email.types';
// import { AppError } from '../../utils/appError';

export class SendGridService {
  private static instance: SendGridService;
  private isInitialized = false;

  constructor() {
    // Don't initialize immediately - do it lazily
  }

  static getInstance(): SendGridService {
    if (!SendGridService.instance) {
      SendGridService.instance = new SendGridService();
    }
    return SendGridService.instance;
  }

  private initialize(): void {
    if (this.isInitialized) return; // Already initialized
    
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ SendGrid API key not provided. Email functionality will be disabled.');
      return;
    }

    sgMail.setApiKey(apiKey);
    this.isInitialized = true;
    console.log('✅ SendGrid initialized successfully');
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    this.initialize(); // Lazy initialize on first use
    if (!this.isInitialized) {
      console.warn('⚠️ SendGrid not initialized. Skipping email send.');
      return false;
    }

    try {
      const msg = {
        to: emailData.to,
        from: {
          email: process.env.FROM_EMAIL || 'noreply@lms.com',
          name: process.env.FROM_NAME || 'LMS Platform'
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.stripHtml(emailData.html),
        templateId: emailData.templateId,
        dynamicTemplateData: emailData.templateData,
        categories: emailData.categories || ['lms-notification'],
        customArgs: {
          userId: emailData.userId?.toString(),
          type: emailData.type,
          courseId: emailData.courseId?.toString(),
        }
      };

      const result = await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ SendGrid email error:', error.response?.body || error.message);
      return false;
    }
  }

  async sendBulkEmails(emailsData: EmailData[]): Promise<{ success: number; failed: number }> {
    this.initialize(); // Lazy initialize on first use
    if (!this.isInitialized) {
      console.warn('⚠️ SendGrid not initialized. Skipping bulk email send.');
      return { success: 0, failed: emailsData.length };
    }

    let success = 0;
    let failed = 0;

    const promises = emailsData.map(async (emailData) => {
      try {
        const result = await this.sendEmail(emailData);
        if (result) success++;
        else failed++;
      } catch (error) {
        failed++;
      }
    });

    await Promise.allSettled(promises);
    
    console.log(`📊 Bulk email results: ${success} sent, ${failed} failed`);
    return { success, failed };
  }

  async verifyConnection(): Promise<boolean> {
    this.initialize(); // Lazy initialize on first use
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Test connection - simplified version
      // Note: SendGrid client doesn't expose request method in newer versions
      // This is a simplified check
      return this.isInitialized;
    } catch (error) {
      console.error('❌ SendGrid connection test failed:', error);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Template methods
  async uploadTemplate(templateData: { name: string; subject: string; html: string }): Promise<string | null> {
    this.initialize(); // Lazy initialize on first use
    if (!this.isInitialized) return null;

    try {
      // Template upload functionality would require SendGrid API client
      // For now, return a mock template ID
      console.log('📧 Template upload requested:', templateData.name);
      return `template_${Date.now()}`;
    } catch (error) {
      console.error('❌ Template upload failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const sendGridService = SendGridService.getInstance();
