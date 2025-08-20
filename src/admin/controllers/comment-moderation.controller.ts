import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { AuthenticatedRequest } from '../../shared/types/global';
import CommentService from '../../shared/services/comments/comment.service';
import { AppError } from '../../shared/utils/appError';

export class CommentModerationController {
  /**
   * Get moderation queue
   * GET /api/admin/comments/moderation
   */
  getModerationQueue = asyncHandler(async (req: Request, res: Response) => {
    const { status, page = '1', limit = '20' } = req.query;

    const result = await CommentService.getModerationQueue(
      status as string,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.comments,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string) || 20,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  });

  /**
   * Moderate comment
   * POST /api/admin/comments/:id/moderate
   */
  moderateComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { action, reason } = req.body;
    const moderatorId = req.user.id;

    if (!action || !['approve', 'reject', 'flag'].includes(action)) {
      throw new AppError('Invalid action. Must be approve, reject, or flag', 400);
    }

    const moderatedComment = await CommentService.moderateComment(
      id,
      moderatorId,
      action as 'approve' | 'reject' | 'flag',
      reason
    );

    res.json({
      success: true,
      data: moderatedComment,
      message: `Comment ${action}d successfully`
    });
  });

  /**
   * Bulk moderate comments
   * POST /api/admin/comments/bulk-moderate
   */
  bulkModerateComments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { commentIds, action, reason } = req.body;
    const moderatorId = req.user.id;

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      throw new AppError('Comment IDs array is required', 400);
    }

    if (!action || !['approve', 'reject', 'flag'].includes(action)) {
      throw new AppError('Invalid action. Must be approve, reject, or flag', 400);
    }

    const results = [];
    const errors = [];

    for (const commentId of commentIds) {
      try {
        const moderatedComment = await CommentService.moderateComment(
          commentId,
          moderatorId,
          action as 'approve' | 'reject' | 'flag',
          reason
        );
        results.push({ commentId, success: true, data: moderatedComment });
      } catch (error) {
        errors.push({ commentId, success: false, error: (error as Error).message });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          total: commentIds.length,
          successful: results.length,
          failed: errors.length
        }
      },
      message: `Bulk moderation completed. ${results.length} successful, ${errors.length} failed.`
    });
  });

  /**
   * Get comment statistics for moderation
   * GET /api/admin/comments/moderation-stats
   */
  getModerationStats = asyncHandler(async (req: Request, res: Response) => {
    const { contentType, contentId } = req.query;

    const stats = await CommentService.getCommentStats(
      contentType as string,
      contentId as string
    );

    // Additional moderation-specific stats
    const moderationStats = {
      ...stats,
      pendingActions: stats.pendingModeration + stats.flaggedComments,
      moderationEfficiency: stats.totalComments > 0 
        ? ((stats.totalComments - stats.pendingModeration) / stats.totalComments * 100).toFixed(2)
        : 0
    };

    res.json({
      success: true,
      data: moderationStats
    });
  });

  /**
   * Get comment reports
   * GET /api/admin/comments/:id/reports
   */
  getCommentReports = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const comment = await CommentService.getCommentById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    res.json({
      success: true,
      data: {
        commentId: id,
        reports: comment.reports || [],
        totalReports: comment.reports?.length || 0
      }
    });
  });

  /**
   * Resolve comment report
   * PUT /api/admin/comments/:id/reports/:reportId/resolve
   */
  resolveReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id, reportId } = req.params;
    const { status, resolutionNote } = req.body;

    if (!status || !['resolved', 'dismissed'].includes(status)) {
      throw new AppError('Invalid status. Must be resolved or dismissed', 400);
    }

    // Update the specific report status
    const comment = await CommentService.getCommentById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const report = comment.reports?.find((r: any) => r._id?.toString() === reportId);
    if (!report) {
      throw new AppError('Report not found', 404);
    }

    report.status = status as 'resolved' | 'dismissed';
    await (comment as any).save();

    res.json({
      success: true,
      message: `Report ${status} successfully`,
      data: { reportId, status, resolutionNote }
    });
  });

  /**
   * Get comment audit trail
   * GET /api/admin/comments/:id/audit
   */
  getCommentAudit = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const comment = await CommentService.getCommentById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const auditTrail = {
      commentId: id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      editHistory: comment.editHistory || [],
      moderationHistory: {
        isModerated: comment.isModerated,
        moderationStatus: comment.moderationStatus,
        moderationReason: comment.moderationReason,
        moderatedBy: comment.moderatedBy,
        moderatedAt: comment.moderatedAt
      },
      engagementHistory: {
        totalLikes: comment.likes?.length || 0,
        totalDislikes: comment.dislikes?.length || 0,
        helpfulVotes: comment.helpfulVotes,
        totalVotes: comment.totalVotes
      },
      reports: comment.reports || []
    };

    res.json({
      success: true,
      data: auditTrail
    });
  });
}

export default new CommentModerationController();
