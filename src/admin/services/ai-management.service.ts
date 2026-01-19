import SystemSettings from '../../shared/models/extended/SystemSettings';
import AIEvaluation from '../../shared/models/ai/AIEvaluation';
import { geminiEvaluationService } from '../../shared/services/ai/gemini-evaluation.service';
import { openAIService } from '../../shared/services/ai/openai.service';

export class AIManagementService {
  /**
   * Get AI settings from database
   */
  static async getAISettings() {
    try {
      const settings = await (SystemSettings as any).getInstance();
      return settings.ai;
    } catch (error) {
      console.error('❌ Error getting AI settings:', error);
      throw error;
    }
  }

  /**
   * Update AI settings
   */
  static async updateAISettings(updates: any) {
    try {
      const settings = await (SystemSettings as any).getInstance();

      // Update AI settings
      if (updates.enabled !== undefined) {
        settings.ai.enabled = updates.enabled;
      }

      if (updates.provider) {
        settings.ai.provider = updates.provider;
      }

      // Update model (e.g., gemini-2.0-flash, gemini-2.5-flash)
      if (updates.model) {
        settings.ai.model = updates.model;
      }

      // Update rate limit settings
      if (updates.rateLimit) {
        if (updates.rateLimit.requestsPerDay !== undefined) {
          settings.ai.rateLimit.requestsPerDay = updates.rateLimit.requestsPerDay;
        }
      }

      if (updates.autoApproval) {
        if (updates.autoApproval.enabled !== undefined) {
          settings.ai.autoApproval.enabled = updates.autoApproval.enabled;
        }
        if (updates.autoApproval.threshold !== undefined) {
          settings.ai.autoApproval.threshold = updates.autoApproval.threshold;
        }
        if (updates.autoApproval.minRequirements) {
          settings.ai.autoApproval.minRequirements = {
            ...settings.ai.autoApproval.minRequirements,
            ...updates.autoApproval.minRequirements
          };
        }
      }

      await settings.save();

      console.log('✅ AI settings updated:', {
        enabled: settings.ai.enabled,
        provider: settings.ai.provider,
        autoApprovalEnabled: settings.ai.autoApproval.enabled,
        threshold: settings.ai.autoApproval.threshold
      });

      return settings.ai;
    } catch (error) {
      console.error('❌ Error updating AI settings:', error);
      throw error;
    }
  }

  /**
   * Get AI evaluations with filters
   */
  static async getEvaluations(options: {
    page: number;
    limit: number;
    status?: string;
    decision?: string;
  }) {
    try {
      const { page, limit, status, decision } = options;

      // Build filter
      const filter: any = {};
      if (status) {
        filter.status = status;
      }
      if (decision) {
        filter['adminReview.decision'] = decision;
      }

      const [evaluations, total] = await Promise.all([
        AIEvaluation.find(filter)
          .populate('courseId', 'title description thumbnail domain level')
          .populate('submittedBy.userId', 'firstName lastName email')
          .populate('adminReview.reviewedBy.userId', 'firstName lastName email')
          .sort({ submittedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        AIEvaluation.countDocuments(filter)
      ]);

      return {
        evaluations,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('❌ Error getting evaluations:', error);
      throw error;
    }
  }

  /**
   * Get evaluation details
   */
  static async getEvaluationDetails(evaluationId: string) {
    try {
      const evaluation = await AIEvaluation.findById(evaluationId)
        .populate('courseId')
        .populate('submittedBy.userId', 'firstName lastName email')
        .populate('adminReview.reviewedBy.userId', 'firstName lastName email');

      return evaluation;
    } catch (error) {
      console.error('❌ Error getting evaluation details:', error);
      throw error;
    }
  }

  /**
   * Get AI statistics
   */
  static async getStatistics() {
    try {
      const settings = await (SystemSettings as any).getInstance();

      const [
        totalEvaluations,
        processingCount,
        completedCount,
        failedCount,
        autoApprovedCount,
        manualApprovedCount,
        rejectedCount,
        needsRevisionCount,
        avgProcessingTime,
        avgAIScore,
        todayUsage
      ] = await Promise.all([
        AIEvaluation.countDocuments(),
        AIEvaluation.countDocuments({ status: 'processing' }),
        AIEvaluation.countDocuments({ status: 'completed' }),
        AIEvaluation.countDocuments({ status: 'failed' }),
        AIEvaluation.countDocuments({
          'adminReview.decision': 'approved',
          'adminReview.adminFeedback': /Auto-approved/i
        }),
        AIEvaluation.countDocuments({
          'adminReview.decision': 'approved',
          'adminReview.adminFeedback': { $not: /Auto-approved/i }
        }),
        AIEvaluation.countDocuments({ 'adminReview.decision': 'rejected' }),
        AIEvaluation.countDocuments({ 'adminReview.decision': 'needs_revision' }),
        AIEvaluation.aggregate([
          { $match: { processingTime: { $exists: true } } },
          { $group: { _id: null, avgTime: { $avg: '$processingTime' } } }
        ]),
        AIEvaluation.aggregate([
          { $match: { 'aiAnalysis.overallScore': { $exists: true } } },
          { $group: { _id: null, avgScore: { $avg: '$aiAnalysis.overallScore' } } }
        ]),
        AIEvaluation.countDocuments({
          submittedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        })
      ]);

      return {
        settings: {
          enabled: settings.ai.enabled,
          provider: settings.ai.provider,
          autoApprovalEnabled: settings.ai.autoApproval.enabled,
          threshold: settings.ai.autoApproval.threshold,
          rateLimit: {
            requestsPerDay: settings.ai.rateLimit.requestsPerDay,
            currentUsage: settings.ai.rateLimit.currentUsage,
            remaining: settings.ai.rateLimit.requestsPerDay - settings.ai.rateLimit.currentUsage,
            lastReset: settings.ai.rateLimit.lastReset
          }
        },
        evaluations: {
          total: totalEvaluations,
          processing: processingCount,
          completed: completedCount,
          failed: failedCount
        },
        decisions: {
          autoApproved: autoApprovedCount,
          manualApproved: manualApprovedCount,
          rejected: rejectedCount,
          needsRevision: needsRevisionCount,
          autoApprovalRate: totalEvaluations > 0
            ? ((autoApprovedCount / totalEvaluations) * 100).toFixed(1)
            : '0'
        },
        performance: {
          avgProcessingTime: avgProcessingTime[0]?.avgTime || 0,
          avgAIScore: avgAIScore[0]?.avgScore ? avgAIScore[0].avgScore.toFixed(1) : '0',
          todayUsage
        }
      };
    } catch (error) {
      console.error('❌ Error getting AI statistics:', error);
      throw error;
    }
  }

  /**
   * Test AI connection
   */
  static async testConnection() {
    try {
      const settings = await (SystemSettings as any).getInstance();

      if (!settings.ai.enabled) {
        return {
          success: false,
          message: 'AI is disabled in settings'
        };
      }

      let result;
      const model = settings.ai.model || 'gemini-2.0-flash';

      if (settings.ai.provider === 'gemini') {
        result = await geminiEvaluationService.testConnection(model);
      } else {
        result = await openAIService.testConnection();
      }

      return {
        success: result,
        provider: settings.ai.provider,
        message: result ? 'Connection successful' : 'Connection failed'
      };
    } catch (error: any) {
      console.error('❌ Test connection error:', error);
      return {
        success: false,
        message: error.message || 'Connection test failed'
      };
    }
  }

  /**
   * Manually trigger AI evaluation for a submitted course
   */
  static async triggerEvaluation(courseId: string) {
    try {
      const Course = (await import('../../shared/models/core/Course')).default;
      const { aiEvaluationService } = await import('../../shared/services/ai/evaluation.service');
      const User = (await import('../../shared/models/core/User')).default;

      // Get course
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check if already has evaluation
      if (course.aiEvaluation?.evaluationId) {
        throw new Error('Course already has an AI evaluation');
      }

      // Get instructor info
      const instructor = await User.findById(course.instructorId);
      if (!instructor) {
        throw new Error('Instructor not found');
      }

      // Submit for AI evaluation
      const evaluation = await aiEvaluationService.submitCourseForEvaluation({
        courseId: courseId,
        submittedBy: {
          userId: instructor._id.toString(),
          name: `${instructor.firstName} ${instructor.lastName}`,
          role: 'teacher'
        }
      });

      console.log(`✅ Manual AI evaluation triggered for course: ${course.title}`);

      return {
        evaluationId: evaluation._id,
        courseId: course._id,
        courseTitle: course.title,
        status: evaluation.status
      };
    } catch (error) {
      console.error('❌ Error triggering evaluation:', error);
      throw error;
    }
  }
}
