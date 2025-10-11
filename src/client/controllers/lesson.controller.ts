import { Request, Response } from 'express';
import { ClientLessonService } from '../services/lesson.service';
import { UserActivityLog } from '../../shared/models';

export class ClientLessonController {
  // Get lesson by ID (for enrolled students)
  static async getLessonById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
      const lesson = await ClientLessonService.getLessonById(id, userId);
      // log view
      UserActivityLog.create({ userId, action: 'lesson_view', resource: 'lesson', resourceId: id, lessonId: id, courseId: (lesson as any).courseId });
      res.json({ success: true, data: lesson });
    } catch (error: any) {
      console.error('Get lesson by ID error:', error);
      res.status(404).json({ success: false, error: error.message || 'Lesson not found' });
    }
  }

  // Get lessons by section (for enrolled students)
  static async getLessonsBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const user = (req as any).user;
      const userId = user?._id || user?.id;

      console.log('🔍 getLessonsBySection - Auth check:', {
        hasUser: !!user,
        userId,
        userRoles: user?.roles,
        sectionId
      });

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
      console.error('Get lessons by section error:', error);
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
      const userId = (req as any).user?._id;

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
      console.error('Get lesson content error:', error);
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
      const userId = (req as any).user?._id;

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
      console.error('Get lesson progress error:', error);
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
      const userId = (req as any).user?._id;

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
      console.error('Get next lesson error:', error);
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
      const userId = (req as any).user?._id;

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
      console.error('Get previous lesson error:', error);
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
      const userId = (req as any).user?._id;
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
      const result = await ClientLessonService.markLessonCompleted(id, userId);
      // log complete
      UserActivityLog.create({ userId, action: 'lesson_complete', resource: 'lesson', resourceId: id, lessonId: id, courseId: (result as any).courseId });
      res.json({ success: true, message: 'Lesson marked as completed', data: result });
    } catch (error: any) {
      console.error('Mark lesson completed error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to mark lesson as completed' });
    }
  }

  // Track/add time spent on lesson
  static async addTimeSpent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { seconds } = req.body || {};
      const userId = (req as any).user?._id;
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
      const userId = (req as any).user?._id;

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
      console.error('Get lesson attachments error:', error);
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
      const userId = (req as any).user?._id;

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
      console.error('Get lesson navigation error:', error);
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
      const userId = (req as any).user?._id;

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
      console.error('Get lesson summary error:', error);
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
      console.error('Create lesson error:', error);
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
      console.error('Update lesson error:', error);
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
      console.error('Delete lesson error:', error);
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
      console.error('Reorder lessons error:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to reorder lessons'
      });
    }
  }
}
