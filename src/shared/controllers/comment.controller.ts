import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types/global';
import CommentService from '../services/comments/comment.service';
import { AppError } from '../utils/appError';

export class CommentController {
  /**
   * Create a new comment
   * POST /api/comments
   */
  createComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { content, contentType, contentId, parentId } = req.body;
    const userId = req.user.id;

    if (!content || !contentType || !contentId) {
      throw new AppError('Missing required fields: content, contentType, contentId', 400);
    }

    // Determine author type from user roles
    let authorType: 'student' | 'teacher' | 'admin' = 'student';
    if (req.user.roles.includes('admin')) {
      authorType = 'admin';
    } else if (req.user.roles.includes('teacher')) {
      authorType = 'teacher';
    }

    const comment = await CommentService.createComment({
      content,
      authorId: userId,
      authorType,
      contentType,
      contentId,
      parentId
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment created successfully'
    });
  });

  /**
   * Get comments with filters
   * GET /api/comments
   */
  getComments = asyncHandler(async (req: Request, res: Response) => {
    const {
      contentType,
      contentId,
      authorId,
      parentId,
      rootId,
      moderationStatus,
      isApproved,
      sortBy,
      sortOrder,
      page,
      limit
    } = req.query;

    const filters = {
      contentType: contentType as string,
      contentId: contentId as string,
      authorId: authorId as string,
      parentId: parentId as string,
      rootId: rootId as string,
      moderationStatus: moderationStatus as string,
      isApproved: isApproved === 'true',
      sortBy: sortBy as 'createdAt' | 'updatedAt' | 'likes' | 'helpfulVotes' | 'totalVotes',
      sortOrder: sortOrder as 'asc' | 'desc',
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20
    };

    const result = await CommentService.getComments(filters);

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
   * Get comment tree (nested structure)
   * GET /api/comments/tree/:contentType/:contentId
   */
  getCommentTree = asyncHandler(async (req: Request, res: Response) => {
    const { contentType, contentId } = req.params;
    const { maxDepth = '3' } = req.query;

    const commentTree = await CommentService.getCommentTree(
      contentType,
      contentId,
      parseInt(maxDepth as string)
    );

    res.json({
      success: true,
      data: commentTree
    });
  });

  /**
   * Get comment by ID
   * GET /api/comments/:id
   */
  getCommentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const comment = await CommentService.getCommentById(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    res.json({
      success: true,
      data: comment
    });
  });

  /**
   * Update comment
   * PUT /api/comments/:id
   */
  updateComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { content, reason } = req.body;
    const userId = req.user.id;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    const updatedComment = await CommentService.updateComment(id, userId, {
      content,
      reason
    });

    res.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    });
  });

  /**
   * Delete comment
   * DELETE /api/comments/:id
   */
  deleteComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles;

    await CommentService.deleteComment(id, userId, userRoles);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  });

  /**
   * Toggle like on comment
   * POST /api/comments/:id/like
   */
  toggleLike = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await CommentService.toggleLike(id, userId);

    res.json({
      success: true,
      data: result,
      message: 'Like toggled successfully'
    });
  });

  /**
   * Toggle dislike on comment
   * POST /api/comments/:id/dislike
   */
  toggleDislike = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await CommentService.toggleDislike(id, userId);

    res.json({
      success: true,
      data: result,
      message: 'Dislike toggled successfully'
    });
  });

  /**
   * Report comment
   * POST /api/comments/:id/report
   */
  reportComment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    if (!reason) {
      throw new AppError('Reason is required for reporting', 400);
    }

    await CommentService.reportComment(id, userId, reason, description);

    res.json({
      success: true,
      message: 'Comment reported successfully'
    });
  });

  /**
   * Mark comment as helpful
   * POST /api/comments/:id/helpful
   */
  markAsHelpful = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    const helpfulVotes = await CommentService.markAsHelpful(id, userId);

    res.json({
      success: true,
      data: { helpfulVotes },
      message: 'Comment marked as helpful'
    });
  });

  /**
   * Get comment statistics
   * GET /api/comments/stats
   */
  getCommentStats = asyncHandler(async (req: Request, res: Response) => {
    const { contentType, contentId } = req.query;

    const stats = await CommentService.getCommentStats(
      contentType as string,
      contentId as string
    );

    res.json({
      success: true,
      data: stats
    });
  });
}

export default new CommentController();
