import { Request, Response } from 'express';
import { ClientCourseService } from '../services/course.service';
import { UserActivityLog } from '../../shared/models';

export class ClientCourseController {
  // Get all published courses with pagination and filters
  static async getPublishedCourses(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        domain,
        level,
        instructorId,
        minPrice,
        maxPrice,
        isFree,
        isFeatured,
        language,
        certificate,
        priceRange,
        rating,
        duration
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (search) filters.search = search as string;
      if (domain) filters.domain = domain as string;
      if (level) filters.level = level as string;
      if (instructorId) filters.instructorId = instructorId as string;
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (isFree !== undefined) filters.isFree = isFree === 'true';
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
      if (language) filters.language = language as string;
      if (certificate !== undefined) filters.certificate = certificate === 'true';

      // Handle price range filter
      if (priceRange) {
        switch (priceRange) {
          case 'free':
            filters.isFree = true;
            break;
          case '0-100000':
            filters.minPrice = 0;
            filters.maxPrice = 100000;
            break;
          case '100000-500000':
            filters.minPrice = 100000;
            filters.maxPrice = 500000;
            break;
          case '500000-1000000':
            filters.minPrice = 500000;
            filters.maxPrice = 1000000;
            break;
          case '1000000+':
            filters.minPrice = 1000000;
            break;
        }
      }

      // Handle rating filter
      if (rating) {
        const ratingStr = rating.toString();
        if (ratingStr.includes('+')) {
          const minRating = parseFloat(ratingStr.replace('+', ''));
          filters.minRating = minRating;
        }
      }

      // Handle duration filter
      if (duration) {
        switch (duration) {
          case '0-2':
            filters.minDuration = 0;
            filters.maxDuration = 2;
            break;
          case '2-5':
            filters.minDuration = 2;
            filters.maxDuration = 5;
            break;
          case '5-10':
            filters.minDuration = 5;
            filters.maxDuration = 10;
            break;
          case '10+':
            filters.minDuration = 10;
            break;
        }
      }

      const result = await ClientCourseService.getPublishedCourses(
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
      console.error('Get published courses error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get courses'
      });
    }
  }

  // Get course by ID (published and approved only)
  static async getCourseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await ClientCourseService.getCourseById(id);
      const userId = (req as any).user?._id;
      if (userId) {
        UserActivityLog.create({ userId, action: 'course_view', resource: 'course', resourceId: id, courseId: id });
      }

      res.json({
        success: true,
        data: course
      });
    } catch (error: any) {
      console.error('Get course by ID error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Course not found'
      });
    }
  }

  // Get course content (for enrolled students)
  static async getCourseContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const content = await ClientCourseService.getCourseContent(id, userId);
      UserActivityLog.create({ userId, action: 'course_view', resource: 'course', resourceId: id, courseId: id });

      res.json({
        success: true,
        data: content
      });
    } catch (error: any) {
      console.error('Get course content error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get course content'
      });
    }
  }

  // Search courses
  static async searchCourses(req: Request, res: Response) {
    try {
      const { q, limit = 10, domain, level, isFree } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const filters: any = {};
      if (domain) filters.domain = domain as string;
      if (level) filters.level = level as string;
      if (isFree !== undefined) filters.isFree = isFree === 'true';

      const courses = await ClientCourseService.searchCourses(q, Number(limit), filters);

      res.json({
        success: true,
        data: courses
      });
    } catch (error: any) {
      console.error('Search courses error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search courses'
      });
    }
  }

  // Get course categories
  static async getCourseCategories(req: Request, res: Response) {
    try {
      const categories = await ClientCourseService.getCourseCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('Get course categories error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get course categories'
      });
    }
  }

  // Get featured courses
  static async getFeaturedCourses(req: Request, res: Response) {
    try {
      const { limit = 6 } = req.query;
      const courses = await ClientCourseService.getFeaturedCourses(Number(limit));

      res.json({
        success: true,
        data: courses
      });
    } catch (error: any) {
      console.error('Get featured courses error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get featured courses'
      });
    }
  }

  // Get popular courses
  static async getPopularCourses(req: Request, res: Response) {
    try {
      const { limit = 8 } = req.query;
      const courses = await ClientCourseService.getPopularCourses(Number(limit));

      res.json({
        success: true,
        data: courses
      });
    } catch (error: any) {
      console.error('Get popular courses error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get popular courses'
      });
    }
  }

  // Get courses by instructor
  static async getCoursesByInstructor(req: Request, res: Response) {
    try {
      const { instructorId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const result = await ClientCourseService.getCoursesByInstructor(
        instructorId,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Get courses by instructor error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get courses by instructor'
      });
    }
  }

  // Get related courses
  static async getRelatedCourses(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { limit = 4 } = req.query;

      const courses = await ClientCourseService.getRelatedCourses(id, Number(limit));

      res.json({
        success: true,
        data: courses
      });
    } catch (error: any) {
      console.error('Get related courses error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get related courses'
      });
    }
  }

  // Get course progress for enrolled user
  static async getCourseProgress(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?._id; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const progress = await ClientCourseService.getCourseProgress(id, userId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      console.error('Get course progress error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to get course progress'
      });
    }
  }

  // Get course recommendations
  static async getCourseRecommendations(req: Request, res: Response) {
    try {
      const { limit = 6 } = req.query;
      const userId = (req as any).user?._id; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const recommendations = await ClientCourseService.getCourseRecommendations(userId, Number(limit));

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      console.error('Get course recommendations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get course recommendations'
      });
    }
  }

  // Get lesson content (for enrolled students)
  static async getLessonContent(req: Request, res: Response) {
    try {
      const { courseId, lessonId } = req.params;
      const userId = (req as any).user?._id; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user is enrolled
      const enrollment = await (await import('../../shared/models')).Enrollment.findOne({
        courseId,
        studentId: userId,
        isActive: true
      });

      if (!enrollment) {
        return res.status(403).json({
          success: false,
          error: 'You must be enrolled to access lesson content'
        });
      }

      // Get lesson content
      const lesson = await (await import('../../shared/models')).Lesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: 'Lesson not found'
        });
      }

      res.json({
        success: true,
        data: lesson
      });
    } catch (error: any) {
      console.error('Get lesson content error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get lesson content'
      });
    }
  }
}
