import { Request, Response } from 'express';
import { AdminAssignmentService } from '../services/assignment.service';

export class AdminAssignmentController {
  private assignmentService: AdminAssignmentService;

  constructor() {
    this.assignmentService = new AdminAssignmentService();
  }

  // Create new assignment
  async createAssignment(req: Request, res: Response) {
    try {
      const assignmentData = req.body;
      const assignment = await this.assignmentService.createAssignment(assignmentData);
      
      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create assignment',
        error: error.message
      });
    }
  }

  // Get assignment by ID
  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const assignment = await this.assignmentService.getAssignmentById(id);
      
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        data: assignment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get assignment',
        error: error.message
      });
    }
  }

  // Get assignments by lesson
  async getAssignmentsByLesson(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const { page = 1, limit = 10, type, isRequired } = req.query;
      
      const assignments = await this.assignmentService.getAssignmentsByLesson(
        lessonId,
        {
          page: Number(page),
          limit: Number(limit),
          type: type as string,
          isRequired: isRequired === 'true'
        }
      );

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get assignments',
        error: error.message
      });
    }
  }

  // Get assignments by course
  async getAssignmentsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { page = 1, limit = 10, type, isRequired, status } = req.query;
      
      const assignments = await this.assignmentService.getAssignmentsByCourse(
        courseId,
        {
          page: Number(page),
          limit: Number(limit),
          type: type as string,
          isRequired: isRequired === 'true',
          status: status as string
        }
      );

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get assignments',
        error: error.message
      });
    }
  }

  // Update assignment
  async updateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const assignment = await this.assignmentService.updateAssignment(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Assignment updated successfully',
        data: assignment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update assignment',
        error: error.message
      });
    }
  }

  // Delete assignment
  async deleteAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.assignmentService.deleteAssignment(id);
      
      res.status(200).json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete assignment',
        error: error.message
      });
    }
  }

  // Toggle assignment required status
  async toggleAssignmentRequired(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isRequired } = req.body;
      
      const assignment = await this.assignmentService.toggleAssignmentRequired(id, isRequired);
      
      res.status(200).json({
        success: true,
        message: `Assignment ${isRequired ? 'marked as required' : 'marked as optional'}`,
        data: assignment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to toggle assignment required status',
        error: error.message
      });
    }
  }

  // Get assignment statistics
  async getAssignmentStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await this.assignmentService.getAssignmentStats(id);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get assignment statistics',
        error: error.message
      });
    }
  }

  // Get overdue assignments
  async getOverdueAssignments(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, courseId } = req.query;
      
      const assignments = await this.assignmentService.getOverdueAssignments({
        page: Number(page),
        limit: Number(limit),
        courseId: courseId as string
      });

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get overdue assignments',
        error: error.message
      });
    }
  }

  // Bulk update assignments
  async bulkUpdateAssignments(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { updates } = req.body;
      
      const result = await this.assignmentService.bulkUpdateAssignments(courseId, updates);
      
      res.status(200).json({
        success: true,
        message: 'Assignments updated successfully',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to bulk update assignments',
        error: error.message
      });
    }
  }

  // Add attachment to assignment
  async addAttachment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const attachmentData = req.body;
      
      const assignment = await this.assignmentService.addAttachment(id, attachmentData);
      
      res.status(200).json({
        success: true,
        message: 'Attachment added successfully',
        data: assignment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add attachment',
        error: error.message
      });
    }
  }

  // Remove attachment from assignment
  async removeAttachment(req: Request, res: Response) {
    try {
      const { id, attachmentIndex } = req.params;
      
      const assignment = await this.assignmentService.removeAttachment(id, Number(attachmentIndex));
      
      res.status(200).json({
        success: true,
        message: 'Attachment removed successfully',
        data: assignment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove attachment',
        error: error.message
      });
    }
  }

  // Search assignments
  async searchAssignments(req: Request, res: Response) {
    try {
      const { q, courseId, lessonId, type, isRequired, page = 1, limit = 10 } = req.query;
      
      const assignments = await this.assignmentService.searchAssignments({
        query: q as string,
        courseId: courseId as string,
        lessonId: lessonId as string,
        type: type as string,
        isRequired: isRequired === 'true',
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to search assignments',
        error: error.message
      });
    }
  }
}
