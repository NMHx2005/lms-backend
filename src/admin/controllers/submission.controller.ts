import { Request, Response } from 'express';
import { AdminSubmissionService } from '../services/submission.service';

const submissionService = new AdminSubmissionService();

export class AdminSubmissionController {
  // Get submission by ID
  async getSubmissionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await submissionService.getSubmissionById(id);
      
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

  // Get submissions by assignment
  async getSubmissionsByAssignment(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const { page = 1, limit = 10, status, isLate } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        isLate: isLate === 'true'
      };

      const result = await submissionService.getSubmissionsByAssignment(assignmentId, filters);

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

  // Get submissions by course
  async getSubmissionsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const { page = 1, limit = 10, status, isLate, assignmentId } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        isLate: isLate === 'true',
        assignmentId: assignmentId as string
      };

      const result = await submissionService.getSubmissionsByCourse(courseId, filters);

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

  // Get pending submissions
  async getPendingSubmissions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, courseId, assignmentId } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        courseId: courseId as string,
        assignmentId: assignmentId as string
      };

      const result = await submissionService.getPendingSubmissions(filters);

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

  // Get late submissions
  async getLateSubmissions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, courseId, assignmentId } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        courseId: courseId as string,
        assignmentId: assignmentId as string
      };

      const result = await submissionService.getLateSubmissions(filters);

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

  // Grade submission
  async gradeSubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { score, feedback, gradedBy } = req.body;

      if (!score || !feedback || !gradedBy) {
        return res.status(400).json({
          success: false,
          message: 'Score, feedback, and grader ID are required'
        });
      }

      const submission = await submissionService.gradeSubmission(id, {
        score: parseInt(score),
        feedback,
        gradedBy
      });

      res.json({
        success: true,
        message: 'Submission graded successfully',
        data: submission
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update submission
  async updateSubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const submission = await submissionService.updateSubmission(id, updateData);

      res.json({
        success: true,
        message: 'Submission updated successfully',
        data: submission
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete submission
  async deleteSubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await submissionService.deleteSubmission(id);

      res.json({
        success: true,
        message: 'Submission deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get submission statistics
  async getSubmissionStats(req: Request, res: Response) {
    try {
      const { assignmentId, courseId } = req.query;

      const stats = await submissionService.getSubmissionStats(
        assignmentId as string,
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

  // Bulk grade submissions
  async bulkGradeSubmissions(req: Request, res: Response) {
    try {
      const { gradingData } = req.body;

      if (!Array.isArray(gradingData) || gradingData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Grading data array is required'
        });
      }

      const results = await submissionService.bulkGradeSubmissions(gradingData);

      res.json({
        success: true,
        message: 'Bulk grading completed',
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search submissions
  async searchSubmissions(req: Request, res: Response) {
    try {
      const { query, page = 1, limit = 10, courseId, assignmentId, studentId, status } = req.query;

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
        assignmentId: assignmentId as string,
        studentId: studentId as string,
        status: status as string
      };

      const result = await submissionService.searchSubmissions(filters);

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

  // Get submission analytics
  async getSubmissionAnalytics(req: Request, res: Response) {
    try {
      const { courseId, startDate, endDate } = req.query;

      let timeRange;
      if (startDate && endDate) {
        timeRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        };
      }

      const analytics = await submissionService.getSubmissionAnalytics(
        courseId as string,
        timeRange
      );

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
