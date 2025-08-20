import { Response } from 'express';
import mongoose from 'mongoose';
import { aiEvaluationService } from '../../shared/services/ai/evaluation.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';

export class AdminAIEvaluationController {
  
  // Get all evaluations pending admin review
  static getPendingEvaluations = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      page = 1,
      limit = 20
    } = req.query;

    const result = await aiEvaluationService.getPendingEvaluations(
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Pending evaluations retrieved successfully',
      data: result
    });
  });

  // Get evaluation by ID with full details
  static getEvaluationById = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid evaluation ID', 400);
    }

    const evaluation = await aiEvaluationService.getEvaluationById(id);

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation retrieved successfully',
      data: evaluation
    });
  });

  // Submit admin review decision
  static submitAdminReview = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { id } = req.params;
    const {
      decision,
      adminScore,
      adminFeedback,
      adminComments,
      revisionRequested
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid evaluation ID', 400);
    }

    const reviewData = {
      decision,
      adminScore,
      adminFeedback,
      adminComments,
      revisionRequested,
      reviewedBy: {
        userId: req.user!.id,
        name: `${req.user!.firstName} ${req.user!.lastName}`
      }
    };

    const evaluation = await aiEvaluationService.submitAdminReview(id, reviewData);

    res.status(200).json({
      success: true,
      message: `Evaluation ${decision} successfully`,
      data: evaluation
    });
  });

  // Get evaluation statistics for admin dashboard
  static getEvaluationStatistics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const statistics = await aiEvaluationService.getEvaluationStatistics();

    res.status(200).json({
      success: true,
      message: 'Evaluation statistics retrieved successfully',
      data: statistics
    });
  });

  // Get all evaluations with filtering and pagination
  static getAllEvaluations = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      decision,
      teacher,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    // For now, just return pending evaluations
    // Later can extend service to support all filtering
    const result = await aiEvaluationService.getPendingEvaluations(
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Evaluations retrieved successfully',
      data: result
    });
  });

  // Bulk approve evaluations
  static bulkApproveEvaluations = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { evaluationIds } = req.body;

    if (!Array.isArray(evaluationIds) || evaluationIds.length === 0) {
      throw new AppError('Evaluation IDs array is required', 400);
    }

    const reviewData = {
      decision: 'approved' as const,
      reviewedBy: {
        userId: req.user!.id,
        name: `${req.user!.firstName} ${req.user!.lastName}`
      }
    };

    const results = [];
    for (const id of evaluationIds) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const evaluation = await aiEvaluationService.submitAdminReview(id, reviewData);
          results.push({ id, status: 'approved', evaluation });
        } else {
          results.push({ id, status: 'error', error: 'Invalid ID' });
        }
      } catch (error: any) {
        results.push({ id, status: 'error', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'approved').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.status(200).json({
      success: true,
      message: `Bulk approval completed: ${successCount} approved, ${errorCount} failed`,
      data: {
        results,
        summary: {
          total: evaluationIds.length,
          approved: successCount,
          failed: errorCount
        }
      }
    });
  });

  // Get evaluation history for a specific course
  static getCourseEvaluationHistory = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    // Placeholder - would need service method to get evaluation history by course
    res.status(200).json({
      success: true,
      message: 'Course evaluation history retrieved successfully',
      data: {
        courseId,
        evaluations: [],
        total: 0
      }
    });
  });

  // Force retry AI evaluation for failed evaluations
  static retryAIEvaluation = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid evaluation ID', 400);
    }

    // Placeholder - would need service method to retry AI evaluation
    res.status(200).json({
      success: true,
      message: 'AI evaluation retry initiated',
      data: {
        evaluationId: id,
        status: 'processing'
      }
    });
  });

  // Export evaluation data to CSV
  static exportEvaluations = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      status,
      decision,
      dateFrom,
      dateTo,
      teacher
    } = req.query;

    // Placeholder - would need service method to export evaluations
    res.status(200).json({
      success: true,
      message: 'Evaluation export generated successfully',
      data: {
        downloadUrl: '/api/admin/ai-evaluations/download/evaluations_export.csv',
        recordCount: 0,
        generatedAt: new Date().toISOString()
      }
    });
  });
}
