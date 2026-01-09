import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';

export class CourseController {
  // Create a new course
  static async createCourse(req: Request, res: Response) {
    try {
      const courseData = req.body;
      const course = await CourseService.createCourse(courseData);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create course'
      });
    }
  }

  // Get course by ID
  static async getCourseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await CourseService.getCourseById(id);

      res.json({
        success: true,
        data: course
      });
    } catch (error: any) {

      res.status(404).json({
        success: false,
        error: error.message || 'Course not found'
      });
    }
  }

  // Get all courses with pagination and filters
  static async getCourses(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        domain,
        level,
        isPublished,
        isApproved,
        isFeatured,
        submittedForReview,
        instructorId,
        instructor,
        minPrice,
        maxPrice
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (search) filters.search = search as string;
      if (domain) filters.domain = domain as string;
      if (level) filters.level = level as string;
      if (isPublished !== undefined) filters.isPublished = isPublished === 'true';
      if (isApproved !== undefined) filters.isApproved = isApproved === 'true';
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
      if (submittedForReview !== undefined) filters.submittedForReview = submittedForReview === 'true';
      if (instructorId) filters.instructorId = instructorId as string;
      if (instructor) filters.instructor = instructor as string;
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);

      const result = await CourseService.getCourses(
        Number(page),
        Number(limit),
        sortBy as string,
        sortOrder as string,
        filters
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get courses'
      });
    }
  }

  // Update course
  static async updateCourse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const course = await CourseService.updateCourse(id, updateData);

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: course
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update course'
      });
    }
  }

  // Delete course
  static async deleteCourse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await CourseService.deleteCourse(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete course'
      });
    }
  }

  // Get course statistics
  static async getCourseStats(req: Request, res: Response) {
    try {
      const stats = await CourseService.getCourseStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get course statistics'
      });
    }
  }

  // Approve/reject course
  static async approveCourse(req: Request, res: Response) {
    try {
      const { courseId, approved, feedback } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'approved must be a boolean value'
        });
      }

      const result = await CourseService.approveCourse(courseId, approved, feedback);

      res.json({
        success: true,
        message: result.message,
        data: result.course
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to approve course'
      });
    }
  }

  // Bulk update course status
  static async bulkUpdateCourseStatus(req: Request, res: Response) {
    try {
      const { courseIds, isPublished, isApproved } = req.body;

      if (!Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'courseIds must be a non-empty array'
        });
      }

      if (typeof isPublished !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isPublished must be a boolean value'
        });
      }

      if (typeof isApproved !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isApproved must be a boolean value'
        });
      }

      const result = await CourseService.bulkUpdateCourseStatus(courseIds, isPublished, isApproved);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to bulk update course status'
      });
    }
  }

  // Search courses
  static async searchCourses(req: Request, res: Response) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const courses = await CourseService.searchCourses(q, Number(limit));

      res.json({
        success: true,
        data: courses
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search courses'
      });
    }
  }

  // Feature/unfeature course
  static async toggleCourseFeature(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;

      if (typeof isFeatured !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isFeatured must be a boolean value'
        });
      }

      const course = await CourseService.updateCourse(id, { isFeatured });

      res.json({
        success: true,
        message: `Course ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
        data: course
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to toggle course feature'
      });
    }
  }

  // Update course status only (without full validation)
  static async updateCourseStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isPublished, isFeatured, status } = req.body;

      // Validate at least one field is provided
      if (isPublished === undefined && isFeatured === undefined && status === undefined) {
        return res.status(400).json({
          success: false,
          error: 'At least one status field (isPublished, isFeatured, or status) must be provided'
        });
      }

      // Validate boolean fields
      if (isPublished !== undefined && typeof isPublished !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isPublished must be a boolean value'
        });
      }

      if (isFeatured !== undefined && typeof isFeatured !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isFeatured must be a boolean value'
        });
      }

      const updateData: any = {};
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (status !== undefined) updateData.status = status;

      const course = await CourseService.updateCourseStatus(id, updateData);

      res.json({
        success: true,
        message: 'Course status updated successfully',
        data: course
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update course status'
      });
    }
  }

  // Get course enrollment statistics
  static async getCourseEnrollmentStats(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await CourseService.getCourseEnrollmentStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get course enrollment statistics'
      });
    }
  }

  // Get pending course approvals
  static async getPendingApprovals(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await CourseService.getPendingApprovals(Number(page), Number(limit));

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get pending approvals'
      });
    }
  }

  // Get course analytics
  static async getCourseAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const analytics = await CourseService.getCourseAnalytics(id, period as string);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get course analytics'
      });
    }
  }
}
