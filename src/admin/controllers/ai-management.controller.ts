import { Request, Response } from 'express';
import { AIManagementService } from '../../admin/services/ai-management.service';

export class AIManagementController {
  /**
   * Get AI settings
   */
  static async getAISettings(req: Request, res: Response) {
    try {
      const settings = await AIManagementService.getAISettings();

      res.json({
        success: true,
        data: settings
      });
    } catch (error: any) {
      console.error('❌ Get AI settings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get AI settings'
      });
    }
  }

  /**
   * Update AI settings
   */
  static async updateAISettings(req: Request, res: Response) {
    try {
      const updates = req.body;
      const settings = await AIManagementService.updateAISettings(updates);

      res.json({
        success: true,
        data: settings,
        message: 'AI settings updated successfully'
      });
    } catch (error: any) {
      console.error('❌ Update AI settings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update AI settings'
      });
    }
  }

  /**
   * Get AI evaluation history
   */
  static async getEvaluations(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const decision = req.query.decision as string;

      const result = await AIManagementService.getEvaluations({
        page,
        limit,
        status,
        decision
      });

      res.json({
        success: true,
        data: result.evaluations,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error: any) {
      console.error('❌ Get evaluations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get evaluations'
      });
    }
  }

  /**
   * Get evaluation details
   */
  static async getEvaluationDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const evaluation = await AIManagementService.getEvaluationDetails(id);

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          error: 'Evaluation not found'
        });
      }

      res.json({
        success: true,
        data: evaluation
      });
    } catch (error: any) {
      console.error('❌ Get evaluation details error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get evaluation details'
      });
    }
  }

  /**
   * Get AI statistics
   */
  static async getStatistics(req: Request, res: Response) {
    try {
      const stats = await AIManagementService.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('❌ Get AI statistics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get AI statistics'
      });
    }
  }

  /**
   * Test AI connection
   */
  static async testConnection(req: Request, res: Response) {
    try {
      const result = await AIManagementService.testConnection();

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ Test AI connection error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test AI connection'
      });
    }
  }

  /**
   * Manually trigger AI evaluation for a course
   */
  static async triggerEvaluation(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const result = await AIManagementService.triggerEvaluation(courseId);

      res.json({
        success: true,
        data: result,
        message: 'AI evaluation triggered successfully'
      });
    } catch (error: any) {
      console.error('❌ Trigger evaluation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to trigger AI evaluation'
      });
    }
  }
}
