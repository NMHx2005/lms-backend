import { Request, Response } from 'express';
import { ClientLessonService } from '../services/lesson.service';
import { UserActivityLog, QuizAttempt } from '../../shared/models';
import { QuizAnalyticsController } from './quiz-analytics.controller';

export class ClientLessonController {
  // Get lesson by ID (for enrolled students)
  static async getLessonById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
      const lesson = await ClientLessonService.getLessonById(id, userId);
      // log view
      UserActivityLog.create({ userId, action: 'lesson_view', resource: 'lesson', resourceId: id, lessonId: id, courseId: (lesson as any).courseId });
      res.json({ success: true, data: lesson });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message || 'Lesson not found' });
    }
  }

  // Get lessons by section (for enrolled students)
  static async getLessonsBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const user = (req as any).user;
      const userId = user?._id || user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const lessons = await ClientLessonService.getLessonsBySection(sectionId, userId);

      res.json({
        success: true,
        data: lessons
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get lessons'
      });
    }
  }

  // Get lesson content (for enrolled students)
  static async getLessonContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const content = await ClientLessonService.getLessonContent(id, userId);

      res.json({
        success: true,
        data: content
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get lesson content'
      });
    }
  }

  // Get lesson progress
  static async getLessonProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      // Support both req.user.id (from auth middleware) and req.user._id (legacy)
      const userId = user?.id || user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const progress = await ClientLessonService.getLessonProgress(id, userId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get lesson progress'
      });
    }
  }

  // Get next lesson (for navigation)
  static async getNextLesson(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const nextLesson = await ClientLessonService.getNextLesson(id, userId);

      res.json({
        success: true,
        data: nextLesson
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get next lesson'
      });
    }
  }

  // Get previous lesson (for navigation)
  static async getPreviousLesson(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const previousLesson = await ClientLessonService.getPreviousLesson(id, userId);

      res.json({
        success: true,
        data: previousLesson
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get previous lesson'
      });
    }
  }

  // Mark lesson as completed
  static async markLessonCompleted(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
      const result = await ClientLessonService.markLessonCompleted(id, userId);
      // log complete
      UserActivityLog.create({ userId, action: 'lesson_complete', resource: 'lesson', resourceId: id, lessonId: id, courseId: (result as any).courseId });
      res.json({ success: true, message: 'Lesson marked as completed', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || 'Failed to mark lesson as completed' });
    }
  }

  // Track/add time spent on lesson
  static async addTimeSpent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { seconds } = req.body || {};
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
      const added = await ClientLessonService.addTimeSpent(id, userId, Number(seconds) || 0);
      // log time
      UserActivityLog.create({ userId, action: 'lesson_pause', resource: 'lesson', resourceId: id, lessonId: id, duration: Number(seconds) || 0 });
      res.json({ success: true, data: added });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || 'Failed to track time' });
    }
  }

  // Get lesson attachments
  static async getLessonAttachments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const attachments = await ClientLessonService.getLessonAttachments(id, userId);

      res.json({
        success: true,
        data: attachments
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get lesson attachments'
      });
    }
  }

  // Get lesson navigation (previous/next)
  static async getLessonNavigation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const navigation = await ClientLessonService.getLessonNavigation(id, userId);

      res.json({
        success: true,
        data: navigation
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get lesson navigation'
      });
    }
  }

  // Get lesson summary
  static async getLessonSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const summary = await ClientLessonService.getLessonSummary(id, userId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get lesson summary'
      });
    }
  }

  // ========== TEACHER CRUD OPERATIONS ==========

  // Create lesson (for course instructors)
  static async createLesson(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const lessonData = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const lesson = await ClientLessonService.createLesson(userId, lessonData);

      res.status(201).json({
        success: true,
        data: lesson
      });
    } catch (error: any) {
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to create lesson'
      });
    }
  }

  // Update lesson (for course instructors)
  static async updateLesson(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const lesson = await ClientLessonService.updateLesson(id, userId, updates);

      res.json({
        success: true,
        data: lesson
      });
    } catch (error: any) {
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to update lesson'
      });
    }
  }

  // Delete lesson (for course instructors)
  static async deleteLesson(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      await ClientLessonService.deleteLesson(id, userId);

      res.json({
        success: true,
        message: 'Lesson deleted successfully'
      });
    } catch (error: any) {
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to delete lesson'
      });
    }
  }

  // Reorder lessons (for course instructors)
  static async reorderLessons(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { sectionId } = req.params;
      const { lessons } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const updatedLessons = await ClientLessonService.reorderLessons(sectionId, userId, lessons);

      res.json({
        success: true,
        data: updatedLessons
      });
    } catch (error: any) {
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to reorder lessons'
      });
    }
  }

  // Get quiz attempts for a lesson
  static async getQuizAttempts(req: Request, res: Response) {
    try {
      const { id: lessonId } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const attempts = await QuizAttempt.find({ lessonId, studentId: userId })
        .sort({ attemptNumber: 1 })
        .lean();

      // Calculate summary
      const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0;
      const averageScore = attempts.length > 0 
        ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length 
        : 0;
      const lastScore = attempts.length > 0 ? attempts[attempts.length - 1].percentage : 0;

      // Get lesson to check settings
      const lesson = await ClientLessonService.getLessonById(lessonId, userId);
      const settings = (lesson as any).quizSettings || {};
      const maxAttempts = settings.maxAttempts;
      const cooldownPeriod = settings.cooldownPeriod || 0;

      const remainingAttempts = maxAttempts ? maxAttempts - attempts.length : null;
      const canRetake = !maxAttempts || remainingAttempts! > 0;

      // Calculate next attempt available time
      let nextAttemptAvailableAt: Date | undefined;
      if (attempts.length > 0 && cooldownPeriod > 0) {
        const lastAttempt = attempts[attempts.length - 1];
        const cooldownEnd = new Date(lastAttempt.submittedAt.getTime() + cooldownPeriod * 1000);
        if (cooldownEnd > new Date()) {
          nextAttemptAvailableAt = cooldownEnd;
        }
      }

      res.json({
        success: true,
        data: {
          attempts,
          bestScore,
          averageScore,
          lastScore,
          remainingAttempts,
          canRetake,
          nextAttemptAvailableAt
        }
      });
    } catch (error: any) {

      res.status(500).json({ success: false, error: error.message || 'Failed to get quiz attempts' });
    }
  }

  // Submit quiz attempt
  static async submitQuizAttempt(req: Request, res: Response) {
    try {
      const { id: lessonId } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const {
        answers,
        score,
        totalPoints,
        percentage,
        correct,
        incorrect,
        unanswered,
        timeSpent,
        startedAt
      } = req.body;

      // Get lesson to check settings
      const lesson = await ClientLessonService.getLessonById(lessonId, userId);
      const courseId = (lesson as any).courseId;
      const settings = (lesson as any).quizSettings || {};

      // Check attempts limit
      const existingAttempts = await QuizAttempt.find({ lessonId, studentId: userId }).sort({ attemptNumber: -1 });
      const nextAttemptNumber = existingAttempts.length > 0 ? existingAttempts[0].attemptNumber + 1 : 1;

      if (settings.maxAttempts && existingAttempts.length >= settings.maxAttempts) {
        return res.status(400).json({
          success: false,
          error: `Bạn đã hết số lần làm bài (${settings.maxAttempts} lần)`
        });
      }

      // Check cooldown period
      if (existingAttempts.length > 0 && settings.cooldownPeriod) {
        const lastAttempt = existingAttempts[0];
        const cooldownEnd = new Date(lastAttempt.submittedAt.getTime() + settings.cooldownPeriod * 1000);
        if (cooldownEnd > new Date()) {
          const minutesLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / 60000);
          return res.status(400).json({
            success: false,
            error: `Vui lòng đợi ${minutesLeft} phút nữa trước khi làm lại`
          });
        }
      }

      // Create quiz attempt
      const quizAttempt = new QuizAttempt({
        lessonId,
        courseId,
        studentId: userId,
        attemptNumber: nextAttemptNumber,
        answers,
        score,
        totalPoints,
        percentage,
        correct,
        incorrect,
        unanswered,
        timeSpent,
        startedAt: startedAt ? new Date(startedAt) : undefined,
        submittedAt: new Date()
      });

      await quizAttempt.save();

      res.json({
        success: true,
        data: quizAttempt
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Attempt already exists for this attempt number'
        });
      }
      res.status(500).json({ success: false, error: error.message || 'Failed to submit quiz attempt' });
    }
  }

  // Get quiz settings
  static async getQuizSettings(req: Request, res: Response) {
    try {
      const { id: lessonId } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const lesson = await ClientLessonService.getLessonById(lessonId, userId);
      const settings = (lesson as any).quizSettings || {};

      res.json({
        success: true,
        data: settings
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Failed to get quiz settings' });
    }
  }

  // Get quiz analytics
  static async getQuizAnalytics(req: Request, res: Response) {
    return QuizAnalyticsController.getQuizAnalytics(req, res);
  }
}
