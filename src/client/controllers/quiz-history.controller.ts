import { Request, Response } from 'express';
import { QuizAttempt } from '../../shared/models/core/QuizAttempt';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export class QuizHistoryController {
  /**
   * Get all quiz attempts for the current user
   * Supports filtering by courseId, pagination
   */
  static getAllQuizAttempts = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { courseId, limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build query
    const query: any = { studentId: userId };
    if (courseId) {
      query.courseId = courseId;
    }

    // Get attempts with populated lesson and course info
    const attempts = await QuizAttempt.find(query)
      .populate('lessonId', 'title lessonNumber')
      .populate('courseId', 'title thumbnail')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const total = await QuizAttempt.countDocuments(query);

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  });

  /**
   * Get quiz attempt by ID
   */
  static getQuizAttemptById = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req as any).user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { id } = req.params;

    const attempt = await QuizAttempt.findOne({
      _id: id,
      studentId: userId
    })
      .populate('lessonId', 'title lessonNumber quizSettings')
      .populate('courseId', 'title thumbnail')
      .lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt not found'
      });
    }

    res.json({
      success: true,
      data: attempt
    });
  });
}
