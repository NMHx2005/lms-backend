import { Request, Response } from 'express';
import { ClientAssignmentService } from '../services/assignment.service';

const assignmentService = new ClientAssignmentService();

export class ClientAssignmentController {
  // Get assignment by ID for student
  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user.id;

      const assignment = await assignmentService.getAssignmentById(id, studentId);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      res.json({
        success: true,
        data: assignment
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get assignments by lesson for student
  async getAssignmentsByLesson(req: Request, res: Response) {
    try {
      const { lessonId } = req.params;
      const { page = 1, limit = 10, type, isRequired } = req.query;
      const studentId = (req as any).user.id;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string,
        isRequired: isRequired === 'true'
      };

      const result = await assignmentService.getAssignmentsByLesson(lessonId, studentId, filters);

      res.json({
        success: true,
        data: result.assignments,
        pagination: result.pagination
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get assignments by course for student
  async getAssignmentsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { page = 1, limit = 10, type, isRequired } = req.query;
      const studentId = (req as any).user.id;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        type: type as string,
        isRequired: isRequired === 'true'
      };

      const result = await assignmentService.getAssignmentsByCourse(courseId, studentId, filters);

      res.json({
        success: true,
        data: result.assignments,
        pagination: result.pagination
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get upcoming assignments for student
  async getUpcomingAssignments(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, courseId } = req.query;
      const studentId = (req as any).user.id;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        courseId: courseId as string
      };

      const result = await assignmentService.getUpcomingAssignments(studentId, filters);

      res.json({
        success: true,
        data: result.assignments,
        pagination: result.pagination
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get assignment progress for student
  async getAssignmentProgress(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const studentId = (req as any).user.id;

      const progress = await assignmentService.getAssignmentProgress(assignmentId, studentId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Submit assignment or save draft
  async submitAssignment(req: Request, res: Response) {
    try {
      const { assignmentId, courseId, answers, fileUrl, fileSize, fileType, textAnswer, isDraft, comment } = req.body;
      const studentId = (req as any).user.id;

      if (!assignmentId || !courseId) {
        return res.status(400).json({
          success: false,
          message: 'Assignment ID and course ID are required'
        });
      }

      const status: 'draft' | 'submitted' = isDraft ? 'draft' : 'submitted';

      const submissionData = {
        assignmentId,
        studentId,
        courseId,
        answers,
        fileUrl,
        fileSize,
        fileType,
        textAnswer,
        isDraft: isDraft === true,
        status,
        comment
      };

      const submission = await assignmentService.submitAssignment(submissionData);

      res.json({
        success: true,
        message: isDraft ? 'Draft saved successfully' : 'Assignment submitted successfully',
        data: submission
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get student's submissions
  async getStudentSubmissions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, courseId, assignmentId, status } = req.query;
      const studentId = (req as any).user.id;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        courseId: courseId as string,
        assignmentId: assignmentId as string,
        status: status as string
      };

      const result = await assignmentService.getStudentSubmissions(studentId, filters);

      res.json({
        success: true,
        data: result.submissions,
        pagination: result.pagination
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get submission by ID for student
  async getSubmissionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = (req as any).user.id;

      const submission = await assignmentService.getSubmissionById(id, studentId);

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      res.json({
        success: true,
        data: submission
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search assignments for student
  async searchAssignments(req: Request, res: Response) {
    try {
      const { query, page = 1, limit = 10, courseId, type } = req.query;
      const studentId = (req as any).user.id;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const filters = {
        query: query as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        courseId: courseId as string,
        type: type as string
      };

      const result = await assignmentService.searchAssignments(query as string, studentId, filters);

      res.json({
        success: true,
        data: result.assignments,
        pagination: result.pagination
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get assignment statistics for student
  async getStudentAssignmentStats(req: Request, res: Response) {
    try {
      const { courseId } = req.query;
      const studentId = (req as any).user.id;

      const stats = await assignmentService.getStudentAssignmentStats(
        studentId,
        courseId as string
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
