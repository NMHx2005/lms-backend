import { Request, Response } from 'express';
import { LessonService } from '../services/lesson.service';

export class LessonController {
  // Create a new lesson
  static async createLesson(req: Request, res: Response) {
    try {
      const lessonData = req.body;
      const lesson = await LessonService.createLesson(lessonData);
      
      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: lesson
      });
    } catch (error: any) {
      console.error('Create lesson error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create lesson'
      });
    }
  }

  // Get lesson by ID
  static async getLessonById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const lesson = await LessonService.getLessonById(id);
      
      res.json({
        success: true,
        data: lesson
      });
    } catch (error: any) {
      console.error('Get lesson by ID error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Lesson not found'
      });
    }
  }

  // Get lessons by section
  static async getLessonsBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const { includeHidden = false } = req.query;
      
      const lessons = await LessonService.getLessonsBySection(
        sectionId, 
        includeHidden === 'true'
      );
      
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

  // Get lessons by course
  static async getLessonsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { type, isPreview, includeHidden = false } = req.query;
      
      const filters: any = {};
      if (type) filters.type = type;
      if (isPreview !== undefined) filters.isPreview = isPreview === 'true';
      if (!includeHidden) filters.isVisible = true;
      
      const lessons = await LessonService.getLessonsByCourse(courseId, filters);
      
      res.json({
        success: true,
        data: lessons
      });
    } catch (error: any) {
      console.error('Get lessons by course error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get lessons'
      });
    }
  }

  // Update lesson
  static async updateLesson(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const lesson = await LessonService.updateLesson(id, updateData);
      
      res.json({
        success: true,
        message: 'Lesson updated successfully',
        data: lesson
      });
    } catch (error: any) {
      console.error('Update lesson error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update lesson'
      });
    }
  }

  // Delete lesson
  static async deleteLesson(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await LessonService.deleteLesson(id);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('Delete lesson error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete lesson'
      });
    }
  }

  // Reorder lessons
  static async reorderLessons(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const { lessonOrders } = req.body; // Array of { lessonId, order }
      
      if (!Array.isArray(lessonOrders)) {
        return res.status(400).json({
          success: false,
          error: 'lessonOrders must be an array'
        });
      }

      const result = await LessonService.reorderLessons(sectionId, lessonOrders);
      
      res.json({
        success: true,
        message: 'Lessons reordered successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Reorder lessons error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to reorder lessons'
      });
    }
  }

  // Toggle lesson preview
  static async toggleLessonPreview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isPreview } = req.body;
      
      if (typeof isPreview !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isPreview must be a boolean value'
        });
      }

      const lesson = await LessonService.updateLesson(id, { isPreview });
      
      res.json({
        success: true,
        message: `Lesson ${isPreview ? 'made preview' : 'removed from preview'} successfully`,
        data: lesson
      });
    } catch (error: any) {
      console.error('Toggle lesson preview error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to toggle lesson preview'
      });
    }
  }

  // Toggle lesson required status
  static async toggleLessonRequired(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isRequired } = req.body;
      
      if (typeof isRequired !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isRequired must be a boolean value'
        });
      }

      const lesson = await LessonService.updateLesson(id, { isRequired });
      
      res.json({
        success: true,
        message: `Lesson ${isRequired ? 'made required' : 'made optional'} successfully`,
        data: lesson
      });
    } catch (error: any) {
      console.error('Toggle lesson required error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to toggle lesson required status'
      });
    }
  }

  // Add attachment to lesson
  static async addAttachment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const attachmentData = req.body;
      
      const lesson = await LessonService.addAttachment(id, attachmentData);
      
      res.json({
        success: true,
        message: 'Attachment added successfully',
        data: lesson
      });
    } catch (error: any) {
      console.error('Add attachment error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to add attachment'
      });
    }
  }

  // Remove attachment from lesson
  static async removeAttachment(req: Request, res: Response) {
    try {
      const { id, attachmentIndex } = req.params;
      
      const lesson = await LessonService.removeAttachment(id, parseInt(attachmentIndex));
      
      res.json({
        success: true,
        message: 'Attachment removed successfully',
        data: lesson
      });
    } catch (error: any) {
      console.error('Remove attachment error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to remove attachment'
      });
    }
  }

  // Get lesson statistics
  static async getLessonStats(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const stats = await LessonService.getLessonStats(courseId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get lesson stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get lesson statistics'
      });
    }
  }

  // Bulk update lessons
  static async bulkUpdateLessons(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const { updates } = req.body; // Array of { lessonId, updates }
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'updates must be an array'
        });
      }

      const result = await LessonService.bulkUpdateLessons(sectionId, updates);
      
      res.json({
        success: true,
        message: 'Lessons updated successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Bulk update lessons error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to bulk update lessons'
      });
    }
  }

  // Move lesson to different section
  static async moveLesson(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newSectionId, newOrder } = req.body;
      
      if (!newSectionId) {
        return res.status(400).json({
          success: false,
          error: 'newSectionId is required'
        });
      }

      const lesson = await LessonService.moveLesson(id, newSectionId, newOrder);
      
      res.json({
        success: true,
        message: 'Lesson moved successfully',
        data: lesson
      });
    } catch (error: any) {
      console.error('Move lesson error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to move lesson'
      });
    }
  }
}
