import { Request, Response } from 'express';
import { SectionService } from '../services/section.service';

export class SectionController {
  // Create a new section
  static async createSection(req: Request, res: Response) {
    try {
      const sectionData = req.body;
      const section = await SectionService.createSection(sectionData);
      
      res.status(201).json({
        success: true,
        message: 'Section created successfully',
        data: section
      });
    } catch (error: any) {
      console.error('Create section error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create section'
      });
    }
  }

  // Get section by ID
  static async getSectionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const section = await SectionService.getSectionById(id);
      
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

  // Get all sections by course
  static async getSectionsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { includeHidden = false } = req.query;
      
      const sections = await SectionService.getSectionsByCourse(
        courseId, 
        includeHidden === 'true'
      );
      
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

  // Update section
  static async updateSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const section = await SectionService.updateSection(id, updateData);
      
      res.json({
        success: true,
        message: 'Section updated successfully',
        data: section
      });
    } catch (error: any) {
      console.error('Update section error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update section'
      });
    }
  }

  // Delete section
  static async deleteSection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await SectionService.deleteSection(id);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('Delete section error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete section'
      });
    }
  }

  // Reorder sections
  static async reorderSections(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { sectionOrders } = req.body; // Array of { sectionId, order }
      
      if (!Array.isArray(sectionOrders)) {
        return res.status(400).json({
          success: false,
          error: 'sectionOrders must be an array'
        });
      }

      const result = await SectionService.reorderSections(courseId, sectionOrders);
      
      res.json({
        success: true,
        message: 'Sections reordered successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Reorder sections error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to reorder sections'
      });
    }
  }

  // Toggle section visibility
  static async toggleSectionVisibility(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isVisible } = req.body;
      
      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isVisible must be a boolean value'
        });
      }

      const section = await SectionService.updateSection(id, { isVisible });
      
      res.json({
        success: true,
        message: `Section ${isVisible ? 'made visible' : 'hidden'} successfully`,
        data: section
      });
    } catch (error: any) {
      console.error('Toggle section visibility error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to toggle section visibility'
      });
    }
  }

  // Get section statistics
  static async getSectionStats(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const stats = await SectionService.getSectionStats(courseId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get section stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get section statistics'
      });
    }
  }

  // Bulk update sections
  static async bulkUpdateSections(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { updates } = req.body; // Array of { sectionId, updates }
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          error: 'updates must be an array'
        });
      }

      const result = await SectionService.bulkUpdateSections(courseId, updates);
      
      res.json({
        success: true,
        message: 'Sections updated successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Bulk update sections error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to bulk update sections'
      });
    }
  }
}
