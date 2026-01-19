import mongoose from 'mongoose';
import AIEvaluation, { IAIEvaluation } from '../../models/ai/AIEvaluation';
import Course from '../../models/core/Course';
import SystemSettings from '../../models/extended/SystemSettings';
import { openAIService } from './openai.service';
import { geminiEvaluationService } from './gemini-evaluation.service';
import { emailNotificationService } from '../email/email-notification.service';
import { webSocketService } from '../websocket/websocket.service';
import User from '../../models/core/User';

export interface SubmissionData {
  courseId: string;
  submittedBy: {
    userId: string;
    name: string;
    role: string;
  };
}

export interface AdminReviewData {
  decision: 'approved' | 'rejected' | 'needs_revision';
  adminScore?: number;
  adminFeedback?: string;
  adminComments?: string;
  revisionRequested?: {
    sections: string[];
    details: string;
    deadline?: Date;
  };
  reviewedBy: {
    userId: string;
    name: string;
  };
}

export class AIEvaluationService {
  private static instance: AIEvaluationService;

  static getInstance(): AIEvaluationService {
    if (!AIEvaluationService.instance) {
      AIEvaluationService.instance = new AIEvaluationService();
    }
    return AIEvaluationService.instance;
  }

  // Submit course for AI evaluation
  async submitCourseForEvaluation(data: SubmissionData): Promise<IAIEvaluation> {
    try {
      // Check if course exists
      const course = await Course.findById(data.courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check if there's already a pending evaluation
      const existingEvaluation = await AIEvaluation.findOne({
        courseId: data.courseId,
        status: { $in: ['processing', 'ai_completed', 'admin_review'] }
      });

      if (existingEvaluation) {
        throw new Error('Course already has a pending evaluation');
      }

      // Create new evaluation record
      const evaluation = new AIEvaluation({
        courseId: data.courseId,
        submittedBy: {
          userId: new mongoose.Types.ObjectId(data.submittedBy.userId),
          name: data.submittedBy.name,
          role: data.submittedBy.role
        },
        status: 'processing',
        aiModelVersion: 'gemini-2.5-flash', // Using Gemini instead of GPT-4
        processingLogs: [{
          timestamp: new Date(),
          stage: 'submission',
          message: 'Course submitted for AI evaluation (using Gemini 2.5 Flash)'
        }]
      });

      await evaluation.save();

      // Update course status to submitted
      course.status = 'submitted';
      await course.save();

      // Start AI evaluation process (async)
      this.processAIEvaluation(evaluation._id.toString()).catch(error => {

      });

      // Send notification to admins
      await this.notifyAdminsNewSubmission(course, evaluation);

      return evaluation;

    } catch (error) {

      throw error;
    }
  }

  // Process AI evaluation (background task)
  private async processAIEvaluation(evaluationId: string): Promise<void> {
    const startTime = Date.now();
    let evaluation: IAIEvaluation | null = null;

    try {
      evaluation = await AIEvaluation.findById(evaluationId);
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      // Log processing start
      await evaluation.addLog('ai_processing', 'Starting AI analysis');

      // Get AI settings to determine model
      const SystemSettingsModel = mongoose.model('SystemSettings');
      const settings = await (SystemSettingsModel as any).getInstance();
      const aiConfig = settings.ai;
      const model = aiConfig.model || 'gemini-2.0-flash';

      // Get AI evaluation - Use Gemini with configured model
      console.log(`🤖 Using AI model: ${model}`);
      const aiResult = await geminiEvaluationService.evaluateCourse(evaluation.courseId.toString(), model);

      // Update evaluation with AI results
      await evaluation.markAICompleted(aiResult);

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      evaluation.processingTime = processingTime;
      await evaluation.save();

      // Check if auto-approval is enabled and score meets threshold
      const autoApproved = await this.autoApproveCourse(evaluation, aiResult);

      if (autoApproved) {
        // Notify teacher about auto-approval
        await this.notifyTeacherAutoApproval(evaluation);
      } else {
        // Notify admin that manual review is needed
        await this.notifyAdminEvaluationReady(evaluation);
        // Notify teacher that evaluation is complete but needs admin review
        await this.notifyTeacherEvaluationComplete(evaluation);
      }

    } catch (error: any) {

      if (evaluation) {
        await evaluation.markFailed(error.message);
        await this.notifyTeacherEvaluationFailed(evaluation, error.message);
      }
    }
  }

  // Admin reviews the AI evaluation
  async submitAdminReview(evaluationId: string, reviewData: AdminReviewData): Promise<IAIEvaluation> {
    try {
      const evaluation = await AIEvaluation.findById(evaluationId).populate('courseId');
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      if (evaluation.status !== 'ai_completed') {
        throw new Error('Evaluation is not ready for admin review');
      }

      // Update admin review
      evaluation.adminReview = {
        reviewedBy: {
          userId: new mongoose.Types.ObjectId(reviewData.reviewedBy.userId),
          name: reviewData.reviewedBy.name
        },
        reviewedAt: new Date(),
        decision: reviewData.decision,
        adminScore: reviewData.adminScore,
        adminFeedback: reviewData.adminFeedback,
        adminComments: reviewData.adminComments,
        revisionRequested: reviewData.revisionRequested
      };

      evaluation.status = 'completed';
      await evaluation.save();

      // Update course status based on decision
      const course = await Course.findById(evaluation.courseId);
      if (course) {
        switch (reviewData.decision) {
          case 'approved':
            course.status = 'approved';
            course.publishedAt = new Date();
            break;
          case 'rejected':
            course.status = 'rejected';
            break;
          case 'needs_revision':
            course.status = 'needs_revision';
            break;
        }
        await course.save();
      }

      // Log admin review
      await evaluation.addLog('admin_review', `Admin decision: ${reviewData.decision}`);

      // Send notifications
      await this.notifyTeacherAdminDecision(evaluation, course);

      return evaluation;

    } catch (error) {

      throw error;
    }
  }

  // Get evaluation by ID
  async getEvaluationById(evaluationId: string): Promise<IAIEvaluation | null> {
    try {
      return await AIEvaluation.findById(evaluationId)
        .populate('courseId', 'title description domain level')
        .populate('submittedBy.userId', 'firstName lastName email')
        .populate('adminReview.reviewedBy.userId', 'firstName lastName email');
    } catch (error) {

      return null;
    }
  }

  // Get evaluations for admin review
  async getPendingEvaluations(page = 1, limit = 20): Promise<{
    evaluations: IAIEvaluation[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const [evaluations, total] = await Promise.all([
        AIEvaluation.find({
          status: 'ai_completed',
          'adminReview.decision': 'pending'
        })
          .populate('courseId', 'title description domain level')
          .populate('submittedBy.userId', 'firstName lastName email')
          .sort({ submittedAt: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
        AIEvaluation.countDocuments({
          status: 'ai_completed',
          'adminReview.decision': 'pending'
        })
      ]);

      return {
        evaluations,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {

      throw error;
    }
  }

  // Get evaluations by teacher
  async getEvaluationsByTeacher(
    teacherId: string,
    page = 1,
    limit = 20
  ): Promise<{
    evaluations: IAIEvaluation[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const [evaluations, total] = await Promise.all([
        AIEvaluation.find({
          'submittedBy.userId': teacherId
        })
          .populate('courseId', 'title description domain level')
          .sort({ submittedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        AIEvaluation.countDocuments({
          'submittedBy.userId': teacherId
        })
      ]);

      return {
        evaluations,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {

      throw error;
    }
  }

  // Get evaluation statistics
  async getEvaluationStatistics(): Promise<any> {
    try {
      const [
        totalEvaluations,
        pendingCount,
        approvedCount,
        rejectedCount,
        needsRevisionCount,
        avgProcessingTime,
        avgAIScore
      ] = await Promise.all([
        AIEvaluation.countDocuments(),
        AIEvaluation.countDocuments({ 'adminReview.decision': 'pending' }),
        AIEvaluation.countDocuments({ 'adminReview.decision': 'approved' }),
        AIEvaluation.countDocuments({ 'adminReview.decision': 'rejected' }),
        AIEvaluation.countDocuments({ 'adminReview.decision': 'needs_revision' }),
        AIEvaluation.aggregate([
          { $group: { _id: null, avgTime: { $avg: '$processingTime' } } }
        ]),
        AIEvaluation.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$aiAnalysis.overallScore' } } }
        ])
      ]);

      return {
        total: totalEvaluations,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        needsRevision: needsRevisionCount,
        averageProcessingTime: avgProcessingTime[0]?.avgTime || 0,
        averageAIScore: avgAIScore[0]?.avgScore || 0,
        approvalRate: totalEvaluations > 0 ? (approvedCount / totalEvaluations * 100) : 0
      };
    } catch (error) {

      throw error;
    }
  }

  // ========== AUTO-APPROVAL LOGIC ==========

  /**
   * Auto-approve course if meets criteria
   * Returns true if course was auto-approved, false otherwise
   */
  private async autoApproveCourse(evaluation: IAIEvaluation, aiResult: any): Promise<boolean> {
    try {
      // Get AI config from database (not from .env)
      const SystemSettings = (await import('../../models/extended/SystemSettings')).default;
      const settings = await (SystemSettings as any).getInstance();
      const aiConfig = settings.ai;

      // Check if AI is enabled
      if (!aiConfig.enabled) {
        console.log('⏭️ AI is disabled in system settings');
        return false;
      }

      // Check if auto-approval is enabled
      if (!aiConfig.autoApproval.enabled) {
        console.log('⏭️ Auto-approval is disabled in system settings');
        return false;
      }

      // Check if score meets threshold
      if (aiResult.overallScore < aiConfig.autoApproval.threshold) {
        console.log(`⏭️ Score ${aiResult.overallScore} < threshold ${aiConfig.autoApproval.threshold}, needs admin review`);
        return false;
      }

      // Increment AI usage counter
      settings.ai.rateLimit.currentUsage += 1;
      await settings.save();

      // Check minimum requirements
      const meetsRequirements = await this.checkAutoApprovalRequirements(evaluation.courseId.toString());
      if (!meetsRequirements) {
        console.log('⏭️ Course does not meet minimum requirements, needs admin review');
        return false;
      }

      console.log(`✅ Auto-approving course (Score: ${aiResult.overallScore}/${aiConfig.autoApproval.threshold})`);

      // Update evaluation status
      evaluation.adminReview = {
        decision: 'approved',
        reviewedAt: new Date(),
        adminFeedback: `Auto-approved by AI (Score: ${aiResult.overallScore}/100)`,
        adminComments: `Course automatically approved based on AI evaluation. Score: ${aiResult.overallScore}/100, Threshold: ${aiConfig.autoApproval.threshold}/100.`
      };
      evaluation.status = 'completed';
      await evaluation.save();

      // Update Course status
      const course = await Course.findById(evaluation.courseId);
      if (course) {
        course.status = 'approved';
        course.isApproved = true;
        course.approvedAt = new Date();

        // Set publishedAt if course is ready to publish
        if (course.isPublished === false) {
          course.isPublished = true;
          course.publishedAt = new Date();
        }

        await course.save();
        console.log(`✅ Course "${course.title}" status updated to approved`);
      }

      // Log auto-approval
      await evaluation.addLog('auto_approval', `Course auto-approved with score ${aiResult.overallScore}/100`);

      return true;

    } catch (error: any) {
      console.error('❌ Auto-approval failed:', error.message);
      return false;
    }
  }

  /**
   * Check if course meets minimum requirements for auto-approval
   */
  private async checkAutoApprovalRequirements(courseId: string): Promise<boolean> {
    try {
      // Get AI config from database
      const SystemSettings = (await import('../../models/extended/SystemSettings')).default;
      const settings = await (SystemSettings as any).getInstance();
      const requirements = settings.ai.autoApproval.minRequirements;

      // Get course
      const course = await Course.findById(courseId);
      if (!course) {
        return false;
      }

      // Check description
      if (requirements.hasDescription) {
        if (!course.description || course.description.length < 50) {
          console.log('❌ Course description too short (<50 chars)');
          return false;
        }
      }

      // Check learning objectives
      if (requirements.hasLearningObjectives) {
        if (!course.learningObjectives || course.learningObjectives.length === 0) {
          console.log('❌ Course has no learning objectives');
          return false;
        }
      }

      // Check sections
      const Section = (await import('../../models/core/Section')).default;
      const sectionsCount = await Section.countDocuments({ courseId });
      if (sectionsCount < requirements.minSections) {
        console.log(`❌ Course has ${sectionsCount} sections, requires ${requirements.minSections}`);
        return false;
      }

      // Check lessons
      const Lesson = (await import('../../models/core/Lesson')).default;
      const sectionIds = await Section.find({ courseId }).distinct('_id');
      const lessonsCount = await Lesson.countDocuments({ sectionId: { $in: sectionIds } });
      if (lessonsCount < requirements.minLessons) {
        console.log(`❌ Course has ${lessonsCount} lessons, requires ${requirements.minLessons}`);
        return false;
      }

      console.log(`✅ Course meets all minimum requirements`);
      return true;

    } catch (error: any) {
      console.error('❌ Error checking requirements:', error.message);
      return false;
    }
  }

  // ========== NOTIFICATION METHODS ==========

  /**
   * Notify teacher about auto-approval
   */
  private async notifyTeacherAutoApproval(evaluation: IAIEvaluation): Promise<void> {
    try {
      const course = await Course.findById(evaluation.courseId);
      const teacher = await User.findById(evaluation.submittedBy.userId);

      if (teacher && course) {
        // WebSocket notification
        webSocketService.sendToUser(teacher._id.toString(), {
          type: 'success',
          title: '🎉 Khóa học được duyệt tự động!',
          message: `Khóa học "${course.title}" đã được AI đánh giá và tự động duyệt (Score: ${evaluation.aiAnalysis?.overallScore}/100).`,
          actionUrl: `/teacher/courses/${course._id}`,
          priority: 'high'
        });

        // Email notification
        await emailNotificationService.sendEmail({
          to: teacher.email,
          subject: `🎉 Khóa học được duyệt tự động: ${course.title}`,
          html: `
            <h2>Chúc mừng! Khóa học đã được duyệt tự động</h2>
            <p>Xin chào ${teacher.firstName},</p>
            <p>Khóa học <strong>"${course.title}"</strong> của bạn đã được hệ thống AI đánh giá và tự động duyệt.</p>
            <p><strong>Điểm AI:</strong> ${evaluation.aiAnalysis?.overallScore}/100</p>
            <p><strong>Trạng thái:</strong> Đã duyệt và xuất bản</p>
            <p>Khóa học của bạn đã sẵn sàng cho học viên đăng ký!</p>
            <p>Bạn có thể xem chi tiết tại dashboard của mình.</p>
          `,
          type: 'course_evaluation',
          userId: teacher._id,
          courseId: course._id
        });
      }
    } catch (error) {
      console.error('❌ Error notifying teacher about auto-approval:', error);
    }
  }

  // Notification methods
  private async notifyAdminsNewSubmission(course: any, evaluation: IAIEvaluation): Promise<void> {
    try {
      const admins = await User.find({ role: 'admin', isActive: true });

      for (const admin of admins) {
        // WebSocket notification
        webSocketService.sendToUser(admin._id.toString(), {
          type: 'info',
          title: 'Khóa học mới chờ duyệt',
          message: `Khóa học "${course.title}" đã được gửi đánh giá AI`,
          actionUrl: `/admin/evaluations/${evaluation._id}`,
          priority: 'normal'
        });

        // Email notification
        await emailNotificationService.sendEmail({
          to: admin.email,
          subject: `🤖 Khóa học mới chờ duyệt AI: ${course.title}`,
          html: `
            <h2>Khóa học mới cần đánh giá</h2>
            <p><strong>Khóa học:</strong> ${course.title}</p>
            <p><strong>Giảng viên:</strong> ${evaluation.submittedBy.name}</p>
            <p><strong>Thời gian gửi:</strong> ${evaluation.submittedAt.toLocaleString('vi-VN')}</p>
            <p>Hệ thống AI đang thực hiện đánh giá. Bạn sẽ nhận được thông báo khi quá trình hoàn tất.</p>
          `,
          type: 'course_evaluation',
          userId: admin._id,
          courseId: course._id
        });
      }
    } catch (error) {

    }
  }

  private async notifyAdminEvaluationReady(evaluation: IAIEvaluation): Promise<void> {
    try {
      const course = await Course.findById(evaluation.courseId);
      const admins = await User.find({ role: 'admin', isActive: true });

      for (const admin of admins) {
        // WebSocket notification
        webSocketService.sendToUser(admin._id.toString(), {
          type: 'success',
          title: 'Đánh giá AI hoàn tất',
          message: `Khóa học "${course?.title}" đã được AI đánh giá xong. Cần duyệt admin.`,
          actionUrl: `/admin/evaluations/${evaluation._id}`,
          priority: 'high'
        });
      }
    } catch (error) {

    }
  }

  private async notifyTeacherEvaluationComplete(evaluation: IAIEvaluation): Promise<void> {
    try {
      const course = await Course.findById(evaluation.courseId);
      const teacher = await User.findById(evaluation.submittedBy.userId);

      if (teacher) {
        // WebSocket notification
        webSocketService.sendToUser(teacher._id.toString(), {
          type: 'info',
          title: 'Đánh giá AI hoàn tất',
          message: `Khóa học "${course?.title}" đã được AI đánh giá. Đang chờ admin duyệt.`,
          actionUrl: `/teacher/courses/${course?._id}/evaluation`,
          priority: 'normal'
        });

        // Email notification
        await emailNotificationService.sendEmail({
          to: teacher.email,
          subject: `🤖 Đánh giá AI hoàn tất: ${course?.title}`,
          html: `
            <h2>Đánh giá AI đã hoàn tất</h2>
            <p>Xin chào ${teacher.firstName},</p>
            <p>Khóa học <strong>"${course?.title}"</strong> của bạn đã được hệ thống AI đánh giá.</p>
            <p><strong>Điểm AI:</strong> ${evaluation.aiAnalysis?.overallScore}/100</p>
            <p>Khóa học hiện đang chờ admin duyệt cuối cùng. Bạn sẽ nhận được thông báo khi có kết quả.</p>
            <p>Bạn có thể xem chi tiết đánh giá tại dashboard của mình.</p>
          `,
          type: 'course_evaluation',
          userId: teacher._id,
          courseId: course?._id
        });
      }
    } catch (error) {

    }
  }

  private async notifyTeacherEvaluationFailed(evaluation: IAIEvaluation, errorMessage: string): Promise<void> {
    try {
      const course = await Course.findById(evaluation.courseId);
      const teacher = await User.findById(evaluation.submittedBy.userId);

      if (teacher) {
        // WebSocket notification
        webSocketService.sendToUser(teacher._id.toString(), {
          type: 'error',
          title: 'Lỗi đánh giá AI',
          message: `Có lỗi xảy ra khi đánh giá khóa học "${course?.title}". Vui lòng thử lại.`,
          actionUrl: `/teacher/courses/${course?._id}`,
          priority: 'high'
        });
      }
    } catch (error) {

    }
  }

  private async notifyTeacherAdminDecision(evaluation: IAIEvaluation, course: any): Promise<void> {
    try {
      const teacher = await User.findById(evaluation.submittedBy.userId);
      if (!teacher) return;

      const decision = evaluation.adminReview.decision;
      let messageType: 'success' | 'warning' | 'error' = 'success';
      let title = '';
      let message = '';

      switch (decision) {
        case 'approved':
          messageType = 'success';
          title = 'Khóa học được duyệt';
          message = `Chúc mừng! Khóa học "${course.title}" đã được duyệt và xuất bản.`;
          break;
        case 'rejected':
          messageType = 'error';
          title = 'Khóa học bị từ chối';
          message = `Khóa học "${course.title}" đã bị từ chối. Vui lòng xem phản hồi.`;
          break;
        case 'needs_revision':
          messageType = 'warning';
          title = 'Khóa học cần chỉnh sửa';
          message = `Khóa học "${course.title}" cần chỉnh sửa. Vui lòng xem yêu cầu.`;
          break;
      }

      // WebSocket notification
      webSocketService.sendToUser(teacher._id.toString(), {
        type: messageType,
        title,
        message,
        actionUrl: `/teacher/courses/${course._id}/evaluation`,
        priority: decision === 'approved' ? 'high' : 'normal'
      });

      // Email notification
      await emailNotificationService.sendEmail({
        to: teacher.email,
        subject: `📋 ${title}: ${course.title}`,
        html: `
          <h2>${title}</h2>
          <p>Xin chào ${teacher.firstName},</p>
          <p>Khóa học <strong>"${course.title}"</strong> của bạn đã được admin xem xét.</p>
          <p><strong>Quyết định:</strong> ${decision === 'approved' ? 'Được duyệt' : decision === 'rejected' ? 'Bị từ chối' : 'Cần chỉnh sửa'}</p>
          ${evaluation.adminReview.adminFeedback ? `<p><strong>Phản hồi:</strong> ${evaluation.adminReview.adminFeedback}</p>` : ''}
          ${evaluation.adminReview.adminComments ? `<p><strong>Ghi chú:</strong> ${evaluation.adminReview.adminComments}</p>` : ''}
          <p>Vui lòng đăng nhập để xem chi tiết.</p>
        `,
        type: 'course_evaluation',
        userId: teacher._id,
        courseId: course._id
      });
    } catch (error) {

    }
  }
}

export const aiEvaluationService = AIEvaluationService.getInstance();
