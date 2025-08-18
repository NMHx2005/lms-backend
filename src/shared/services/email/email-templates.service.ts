import { EmailTemplate, TemplateVariables, EmailType } from '../../types/email.types';

export class EmailTemplatesService {
  // Welcome email template
  static getWelcomeTemplate(variables: TemplateVariables): { subject: string; html: string } {
    const subject = `Chào mừng ${variables.firstName} đến với ${variables.siteName}!`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Chào mừng</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Chào mừng đến với ${variables.siteName}!</h1>
            </div>
            <div class="content">
                <h2>Xin chào ${variables.firstName}!</h2>
                <p>Chúc mừng bạn đã tham gia cộng đồng học tập trực tuyến hàng đầu!</p>
                <p>Với tài khoản của bạn, bạn có thể:</p>
                <ul>
                    <li>Truy cập hàng ngàn khóa học chất lượng cao</li>
                    <li>Theo dõi tiến trình học tập</li>
                    <li>Nhận chứng chỉ hoàn thành</li>
                    <li>Tương tác với cộng đồng học viên</li>
                </ul>
                <a href="${variables.siteUrl}" class="button">Bắt đầu học ngay</a>
            </div>
            <div class="footer">
                <p>Cần hỗ trợ? Liên hệ: ${variables.supportEmail}</p>
                <p>&copy; ${variables.currentYear} ${variables.siteName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
  }

  // Course enrollment template
  static getCourseEnrollmentTemplate(variables: TemplateVariables): { subject: string; html: string } {
    const subject = `Bạn đã đăng ký thành công khóa học: ${variables.courseName}`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Đăng ký khóa học thành công</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .course-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Đăng ký thành công!</h1>
            </div>
            <div class="content">
                <h2>Chào ${variables.firstName}!</h2>
                <p>Bạn đã đăng ký thành công khóa học:</p>
                <div class="course-info">
                    <h3>${variables.courseName}</h3>
                    <p><strong>Giảng viên:</strong> ${variables.instructorName}</p>
                    <p><strong>Ngày đăng ký:</strong> ${variables.enrollmentDate}</p>
                </div>
                <p>Bạn có thể bắt đầu học ngay bây giờ!</p>
                <a href="${variables.courseUrl}" class="button">Vào học</a>
            </div>
            <div class="footer">
                <p>Cần hỗ trợ? Liên hệ: ${variables.supportEmail}</p>
                <p>&copy; ${variables.currentYear} ${variables.siteName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
  }

  // Assignment due reminder template
  static getAssignmentDueTemplate(variables: TemplateVariables): { subject: string; html: string } {
    const subject = `⏰ Nhắc nhở: Bài tập "${variables.assignmentTitle}" sắp đến hạn`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Nhắc nhở bài tập</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .assignment-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
            .button { display: inline-block; padding: 12px 24px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .urgent { color: #dc3545; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Nhắc nhở bài tập</h1>
            </div>
            <div class="content">
                <h2>Chào ${variables.firstName}!</h2>
                <p>Bài tập của bạn sắp đến hạn nộp:</p>
                <div class="assignment-info">
                    <h3>${variables.assignmentTitle}</h3>
                    <p><strong>Khóa học:</strong> ${variables.courseName}</p>
                    <p class="urgent"><strong>Hạn nộp:</strong> ${variables.dueDate}</p>
                </div>
                <p>Hãy hoàn thành và nộp bài để không bị trễ hạn!</p>
                <a href="${variables.assignmentUrl}" class="button">Làm bài tập</a>
            </div>
            <div class="footer">
                <p>Cần hỗ trợ? Liên hệ: ${variables.supportEmail}</p>
                <p>&copy; ${variables.currentYear} ${variables.siteName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
  }

  // Grade available template
  static getGradeAvailableTemplate(variables: TemplateVariables): { subject: string; html: string } {
    const subject = `📊 Điểm bài tập "${variables.assignmentTitle}" đã có`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Điểm bài tập</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .grade-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
            .grade-score { font-size: 24px; font-weight: bold; color: #17a2b8; }
            .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Kết quả bài tập</h1>
            </div>
            <div class="content">
                <h2>Chào ${variables.firstName}!</h2>
                <p>Điểm bài tập của bạn đã được chấm:</p>
                <div class="grade-info">
                    <h3>${variables.assignmentTitle}</h3>
                    <p><strong>Khóa học:</strong> ${variables.courseName}</p>
                    <div class="grade-score">${variables.grade}/${variables.maxScore}</div>
                    <p>Phần trăm: ${Math.round((Number(variables.grade) / Number(variables.maxScore)) * 100)}%</p>
                </div>
                <a href="${variables.assignmentUrl}" class="button">Xem chi tiết</a>
            </div>
            <div class="footer">
                <p>Cần hỗ trợ? Liên hệ: ${variables.supportEmail}</p>
                <p>&copy; ${variables.currentYear} ${variables.siteName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
  }

  // Payment confirmation template
  static getPaymentConfirmationTemplate(variables: TemplateVariables): { subject: string; html: string } {
    const subject = `✅ Thanh toán thành công - Đơn hàng #${variables.orderId}`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Xác nhận thanh toán</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .payment-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .amount { font-size: 20px; font-weight: bold; color: #28a745; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Thanh toán thành công!</h1>
            </div>
            <div class="content">
                <h2>Chào ${variables.firstName}!</h2>
                <p>Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xác nhận.</p>
                <div class="payment-info">
                    <p><strong>Mã đơn hàng:</strong> #${variables.orderId}</p>
                    <p><strong>Số tiền:</strong> <span class="amount">${variables.amount?.toLocaleString()} ${variables.currency}</span></p>
                    <p><strong>Ngày thanh toán:</strong> ${variables.paymentDate}</p>
                </div>
                <p>Hóa đơn chi tiết đã được gửi kèm theo email này.</p>
                <a href="${variables.invoiceUrl}" class="button">Xem hóa đơn</a>
            </div>
            <div class="footer">
                <p>Cần hỗ trợ? Liên hệ: ${variables.supportEmail}</p>
                <p>&copy; ${variables.currentYear} ${variables.siteName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
  }

  // Course completion template
  static getCourseCompletionTemplate(variables: TemplateVariables): { subject: string; html: string } {
    const subject = `🎓 Chúc mừng! Bạn đã hoàn thành khóa học "${variables.courseName}"`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Hoàn thành khóa học</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .completion-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
            .certificate { font-size: 18px; font-weight: bold; color: #6f42c1; }
            .button { display: inline-block; padding: 12px 24px; background: #6f42c1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 Chúc mừng!</h1>
            </div>
            <div class="content">
                <h2>Chào ${variables.firstName}!</h2>
                <p>Bạn đã hoàn thành xuất sắc khóa học:</p>
                <div class="completion-info">
                    <h3>${variables.courseName}</h3>
                    <p><strong>Giảng viên:</strong> ${variables.instructorName}</p>
                    <p><strong>Ngày hoàn thành:</strong> ${variables.completionDate}</p>
                    <div class="certificate">🏆 Chứng chỉ đã sẵn sàng!</div>
                </div>
                <p>Bạn có thể tải chứng chỉ hoàn thành và chia sẻ thành tích này!</p>
                <a href="${variables.courseUrl}" class="button">Tải chứng chỉ</a>
            </div>
            <div class="footer">
                <p>Cần hỗ trợ? Liên hệ: ${variables.supportEmail}</p>
                <p>&copy; ${variables.currentYear} ${variables.siteName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
  }

  // Password reset template
  static getPasswordResetTemplate(variables: TemplateVariables & { resetUrl: string; resetToken: string }): { subject: string; html: string } {
    const subject = `🔐 Yêu cầu đặt lại mật khẩu cho tài khoản ${variables.siteName}`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Đặt lại mật khẩu</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .reset-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .warning { color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
                <h2>Chào ${variables.firstName}!</h2>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <div class="reset-info">
                    <p><strong>Email:</strong> ${variables.userEmail}</p>
                    <p><strong>Thời gian yêu cầu:</strong> ${variables.currentDate}</p>
                </div>
                <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
                <a href="${variables.resetUrl}" class="button">Đặt lại mật khẩu</a>
                <div class="warning">
                    <strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                </div>
            </div>
            <div class="footer">
                <p>Cần hỗ trợ? Liên hệ: ${variables.supportEmail}</p>
                <p>&copy; ${variables.currentYear} ${variables.siteName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
  }

  // Get template by type
  static getTemplate(type: EmailType, variables: TemplateVariables): { subject: string; html: string } {
    const commonVariables = {
      siteName: 'LMS Platform',
      siteUrl: process.env.APP_BASE_URL || 'http://localhost:5000',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com',
      currentYear: new Date().getFullYear(),
      currentDate: new Date().toLocaleDateString('vi-VN'),
      ...variables
    };

    switch (type) {
      case 'welcome':
        return this.getWelcomeTemplate(commonVariables);
      case 'course_enrollment':
        return this.getCourseEnrollmentTemplate(commonVariables);
      case 'assignment_due':
        return this.getAssignmentDueTemplate(commonVariables);
      case 'grade_available':
        return this.getGradeAvailableTemplate(commonVariables);
      case 'payment_confirmation':
        return this.getPaymentConfirmationTemplate(commonVariables);
      case 'course_completion':
        return this.getCourseCompletionTemplate(commonVariables);
      case 'password_reset':
        return this.getPasswordResetTemplate(commonVariables as any);
      default:
        return {
          subject: 'Thông báo từ LMS Platform',
          html: `<p>Bạn có thông báo mới từ ${commonVariables.siteName}</p>`
        };
    }
  }
}
