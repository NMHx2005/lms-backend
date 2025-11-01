import { Request, Response } from 'express';
import { ClientSectionService } from '../services/section.service';
import { UserActivityLog } from '../../shared/models';

export class ClientSectionController {
  // Get sections by course (for enrolled students)
  static async getSectionsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const user = (req as any).user;
      const userId = user?._id || user?.id;

      console.log('🔍 getSectionsByCourse - Auth check:', {
        hasUser: !!user,
        userId,
        userRoles: user?.roles,
        courseId
      });

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const sections = await ClientSectionService.getSectionsByCourse(courseId, userId);
      UserActivityLog.create({ userId, action: 'section_view', resource: 'section', courseId });

      res.json({
        success: true,
        data: sections
      });
    } catch (error: any) {
      console.error('Get sections by course error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get sections'
      });
    }
  }

  // Get section by ID with progress
  static async getSectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const section = await ClientSectionService.getSectionById(id, userId);
      UserActivityLog.create({ userId, action: 'section_view', resource: 'section', resourceId: id, courseId: (section as any).courseId });

      res.json({
        success: true,
        data: section
      });
    } catch (error: any) {
      console.error('Get section by ID error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Section not found'
      });
    }
  }

  // Get section progress
  static async getSectionProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const progress = await ClientSectionService.getSectionProgress(id, userId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      console.error('Get section progress error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get section progress'
      });
    }
  }

  // Get next section (for navigation)
  static async getNextSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const nextSection = await ClientSectionService.getNextSection(id, userId);

      res.json({
        success: true,
        data: nextSection
      });
    } catch (error: any) {
      console.error('Get next section error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get next section'
      });
    }
  }

  // Get previous section (for navigation)
  static async getPreviousSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const previousSection = await ClientSectionService.getPreviousSection(id, userId);

      res.json({
        success: true,
        data: previousSection
      });
    } catch (error: any) {
      console.error('Get previous section error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get previous section'
      });
    }
  }

  // Get section overview (summary)
  static async getSectionOverview(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const overview = await ClientSectionService.getSectionOverview(courseId, userId);

      res.json({
        success: true,
        data: overview
      });
    } catch (error: any) {
      console.error('Get section overview error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get section overview'
      });
    }
  }

  // ========== TEACHER CRUD OPERATIONS ==========

  // Create section (for course instructors)
  static async createSection(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { courseId, title, description, order } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const section = await ClientSectionService.createSection(courseId, userId, { title, description, order });

      res.status(201).json({
        success: true,
        data: section
      });
    } catch (error: any) {
      console.error('Create section error:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to create section'
      });
    }
  }

  // Update section (for course instructors)
  static async updateSection(req: Request, res: Response) {
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

      const section = await ClientSectionService.updateSection(id, userId, updates);

      res.json({
        success: true,
        data: section
      });
    } catch (error: any) {
      console.error('Update section error:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to update section'
      });
    }
  }

  // Delete section (for course instructors)
  static async deleteSection(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      await ClientSectionService.deleteSection(id, userId);

      res.json({
        success: true,
        message: 'Section deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete section error:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to delete section'
      });
    }
  }

  // Reorder sections (for course instructors)
  static async reorderSections(req: Request, res: Response) {
    try {
      const userId = (req as any).user?._id || (req as any).user?.id;
      const { courseId } = req.params;
      const { sections } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const updatedSections = await ClientSectionService.reorderSections(courseId, userId, sections);

      res.json({
        success: true,
        data: updatedSections
      });
    } catch (error: any) {
      console.error('Reorder sections error:', error);
      res.status(error.message.includes('permission') ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to reorder sections'
      });
    }
  }

  // ========== PUBLIC PREVIEW OPERATIONS ==========

  // Get sections for preview (public - no authentication required)
  static async getSectionsForPreview(req: Request, res: Response) {
    try {
      const { courseId } = req.params;

      console.log('🔍 getSectionsForPreview - Public preview:', {
        courseId
      });

      const sections = await ClientSectionService.getSectionsForPreview(courseId);

      res.json({
        success: true,
        data: sections,
        message: 'Course preview - Enroll to access full content'
      });
    } catch (error: any) {
      console.error('Get sections for preview error:', error);
      res.status(error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to get course preview'
      });
    }
  }
}
