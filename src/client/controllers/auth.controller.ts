import { Request, Response, NextFunction } from 'express';
import { ClientAuthService } from '../services/auth.service';

export class ClientAuthController {
  /**
   * Get client dashboard data
   */
  static async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const dashboardData = await ClientAuthService.getDashboardData(req.user!.id);

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update client profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ClientAuthService.updateProfile(req.user!.id, req.body);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's enrolled courses
   */
  static async getEnrolledCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, status, search, category } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (search) filters.search = search as string;
      if (category) filters.category = category as string;

      const result = await ClientAuthService.getEnrolledCourses(
        req.user!.id,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's course progress
   */
  static async getCourseProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await ClientAuthService.getCourseProgress(
        req.user!.id,
        req.params.courseId
      );

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's learning statistics
   */
  static async getLearningStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await ClientAuthService.getLearningStatistics(req.user!.id);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's recent activity
   */
  static async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 10 } = req.query;
      const activity = await ClientAuthService.getRecentActivity(
        req.user!.id,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's certificates
   */
  static async getCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const certificates = await ClientAuthService.getCertificates(req.user!.id);

      res.json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's achievements
   */
  static async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const achievements = await ClientAuthService.getAchievements(req.user!.id);

      res.json({
        success: true,
        data: achievements,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's study schedule
   */
  static async getStudySchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ClientAuthService.getStudySchedule(req.user!.id);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's learning goals
   */
  static async getLearningGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const goals = await ClientAuthService.getLearningGoals(req.user!.id);

      res.json({
        success: true,
        data: goals,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get client profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await ClientAuthService.getUserById(req.user!.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
