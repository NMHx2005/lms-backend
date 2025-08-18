import { Request, Response } from 'express';
import { ClientSectionService } from '../services/section.service';
import { UserActivityLog } from '../../shared/models';

export class ClientSectionController {
  // Get sections by course (for enrolled students)
  static async getSectionsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const userId = (req as any).user?._id; // From auth middleware
      
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
}
