import Comment, { IComment } from '../../models/core/Comment';
import { Types } from 'mongoose';
import { AppError } from '../../utils/appError';

export interface CreateCommentData {
  content: string;
  authorId: string;
  authorType: 'student' | 'teacher' | 'admin';
  contentType: 'course' | 'lesson' | 'discussion' | 'assignment';
  contentId: string;
  parentId?: string;
}

export interface UpdateCommentData {
  content: string;
  reason?: string;
}

export interface CommentFilters {
  contentType?: string;
  contentId?: string;
  authorId?: string;
  parentId?: string;
  rootId?: string;
  moderationStatus?: string;
  isApproved?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'likes' | 'helpfulVotes' | 'totalVotes';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CommentTree {
  comment: IComment;
  replies: CommentTree[];
  totalReplies: number;
  depth: number;
}

export class CommentService {
  /**
   * Create a new comment
   */
  async createComment(data: CreateCommentData): Promise<IComment> {
    try {
      const comment = new Comment({
        content: data.content,
        authorId: new Types.ObjectId(data.authorId),
        authorType: data.authorType,
        contentType: data.contentType,
        contentId: new Types.ObjectId(data.contentId),
        parentId: data.parentId ? new Types.ObjectId(data.parentId) : undefined
      });

      // If this is a reply, set the rootId
      if (data.parentId) {
        const parentComment = await Comment.findById(data.parentId);
        if (parentComment) {
          comment.rootId = parentComment.rootId || parentComment._id;
        }
      }

      await comment.save();
      return comment.populate(['author', 'content']);
    } catch (error) {
      throw new AppError('Failed to create comment', 500);
    }
  }

  /**
   * Get comments with filters and pagination
   */
  async getComments(filters: CommentFilters = {}): Promise<{
    comments: IComment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.contentType) query.contentType = filters.contentType;
      if (filters.contentId) query.contentId = new Types.ObjectId(filters.contentId);
      if (filters.authorId) query.authorId = new Types.ObjectId(filters.authorId);
      if (filters.parentId) query.parentId = new Types.ObjectId(filters.parentId);
      if (filters.rootId) query.rootId = new Types.ObjectId(filters.rootId);
      if (filters.moderationStatus) query.moderationStatus = filters.moderationStatus;
      if (filters.isApproved !== undefined) query.isApproved = filters.isApproved;

      // Build sort object
      const sort: any = {};
      if (filters.sortBy) {
        sort[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = -1; // Default sort by creation date
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        Comment.find(query)
          .populate('author', 'firstName lastName email avatar')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean() as unknown as IComment[],
        Comment.countDocuments(query)
      ]);

      return {
        comments,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new AppError('Failed to fetch comments', 500);
    }
  }

  /**
   * Get comment tree (nested structure)
   */
  async getCommentTree(
    contentType: string,
    contentId: string,
    maxDepth: number = 3
  ): Promise<CommentTree[]> {
    try {
      // Get all top-level comments
      const topLevelComments = await Comment.find({
        contentType,
        contentId,
        parentId: null,
        isApproved: true,
        moderationStatus: 'approved'
      })
        .populate('author', 'firstName lastName email avatar')
        .sort({ createdAt: -1 })
        .lean();

      // Build tree structure
      const commentTree: CommentTree[] = [];
      
      for (const comment of topLevelComments) {
        const tree = await this.buildCommentTree(comment, maxDepth, 0);
        commentTree.push(tree);
      }

      return commentTree;
    } catch (error) {
      throw new AppError('Failed to fetch comment tree', 500);
    }
  }

  /**
   * Build comment tree recursively
   */
  private async buildCommentTree(
    comment: IComment,
    maxDepth: number,
    currentDepth: number
  ): Promise<CommentTree> {
    if (currentDepth >= maxDepth) {
      return {
        comment,
        replies: [],
        totalReplies: 0,
        depth: currentDepth
      };
    }

          const replies = await Comment.find({
        parentId: comment._id,
        isApproved: true,
        moderationStatus: 'approved'
      })
        .populate('author', 'firstName lastName email avatar')
        .sort({ createdAt: 1 })
        .lean() as unknown as IComment[];

      const totalReplies = await Comment.countDocuments({
        rootId: comment.rootId || comment._id,
        parentId: { $ne: null }
      });

      const replyTrees: CommentTree[] = [];
      for (const reply of replies) {
        const replyTree = await this.buildCommentTree(reply, maxDepth, currentDepth + 1);
        replyTrees.push(replyTree);
      }

    return {
      comment,
      replies: replyTrees,
      totalReplies,
      depth: currentDepth
    };
  }

  /**
   * Get comment by ID
   */
  async getCommentById(commentId: string): Promise<IComment | null> {
    try {
      return await Comment.findById(commentId)
        .populate('author', 'firstName lastName email avatar')
        .populate('content')
        .populate('replies')
        .lean();
    } catch (error) {
      throw new AppError('Failed to fetch comment', 500);
    }
  }

  /**
   * Update comment content
   */
  async updateComment(
    commentId: string,
    userId: string,
    data: UpdateCommentData
  ): Promise<IComment> {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      // Check if user is the author or admin
      if (!comment.authorId.equals(new Types.ObjectId(userId))) {
        throw new AppError('Not authorized to edit this comment', 403);
      }

      await comment.editContent(data.content, data.reason);
      return comment.populate(['author', 'content']);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update comment', 500);
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string, userRoles: string[]): Promise<void> {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      // Check if user is the author or admin
      const isAuthor = comment.authorId.equals(new Types.ObjectId(userId));
      const isAdmin = userRoles.includes('admin');
      
      if (!isAuthor && !isAdmin) {
        throw new AppError('Not authorized to delete this comment', 403);
      }

      // If admin is deleting, log the action
      if (isAdmin && !isAuthor) {
        await comment.addReport(
          new Types.ObjectId(userId),
          'deleted_by_admin',
          'Comment deleted by administrator'
        );
      }

      await Comment.findByIdAndDelete(commentId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete comment', 500);
    }
  }

  /**
   * Like/unlike comment
   */
  async toggleLike(commentId: string, userId: string): Promise<{ likes: number; dislikes: number }> {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      await comment.addLike(new Types.ObjectId(userId));
      
      return {
        likes: comment.likes.length,
        dislikes: comment.dislikes.length
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle like', 500);
    }
  }

  /**
   * Dislike/undislike comment
   */
  async toggleDislike(commentId: string, userId: string): Promise<{ likes: number; dislikes: number }> {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      await comment.addDislike(new Types.ObjectId(userId));
      
      return {
        likes: comment.likes.length,
        dislikes: comment.dislikes.length
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to toggle dislike', 500);
    }
  }

  /**
   * Report comment
   */
  async reportComment(
    commentId: string,
    reporterId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      await comment.addReport(new Types.ObjectId(reporterId), reason, description);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to report comment', 500);
    }
  }

  /**
   * Mark comment as helpful
   */
  async markAsHelpful(commentId: string, userId: string): Promise<number> {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      await comment.markAsHelpful(new Types.ObjectId(userId));
      return comment.helpfulVotes;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to mark comment as helpful', 500);
    }
  }

  /**
   * Get comments requiring moderation
   */
  async getModerationQueue(
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    comments: IComment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const query: any = {
        $or: [
          { moderationStatus: 'pending' },
          { moderationStatus: 'flagged' },
          { isApproved: false }
        ]
      };

      if (status) {
        query.moderationStatus = status;
      }

      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        Comment.find(query)
          .populate('author', 'firstName lastName email')
          .populate('moderatedBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean() as unknown as IComment[],
        Comment.countDocuments(query)
      ]);

      return {
        comments,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new AppError('Failed to fetch moderation queue', 500);
    }
  }

  /**
   * Moderate comment
   */
  async moderateComment(
    commentId: string,
    moderatorId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<IComment> {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }

      switch (action) {
        case 'approve':
          await comment.approve(new Types.ObjectId(moderatorId), reason);
          break;
        case 'reject':
          await comment.reject(new Types.ObjectId(moderatorId), reason || 'Rejected by moderator');
          break;
        case 'flag':
          await comment.flag(new Types.ObjectId(moderatorId), reason || 'Flagged by moderator');
          break;
      }

      return comment.populate(['author', 'moderatedBy']);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to moderate comment', 500);
    }
  }

  /**
   * Get comment statistics
   */
  async getCommentStats(contentType?: string, contentId?: string): Promise<{
    totalComments: number;
    totalReplies: number;
    totalLikes: number;
    totalDislikes: number;
    pendingModeration: number;
    flaggedComments: number;
  }> {
    try {
      const match: any = {};
      if (contentType) match.contentType = contentType;
      if (contentId) match.contentId = new Types.ObjectId(contentId);

      const stats = await Comment.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            totalReplies: { $sum: { $cond: [{ $ne: ['$parentId', null] }, 1, 0] } },
            totalLikes: { $sum: { $size: '$likes' } },
            totalDislikes: { $sum: { $size: '$dislikes' } },
            pendingModeration: {
              $sum: {
                $cond: [
                  { $in: ['$moderationStatus', ['pending', 'flagged']] },
                  1,
                  0
                ]
              }
            },
            flaggedComments: {
              $sum: {
                $cond: [
                  { $eq: ['$moderationStatus', 'flagged'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalComments: 0,
        totalReplies: 0,
        totalLikes: 0,
        totalDislikes: 0,
        pendingModeration: 0,
        flaggedComments: 0
      };
    } catch (error) {
      throw new AppError('Failed to fetch comment statistics', 500);
    }
  }
}

export default new CommentService();
