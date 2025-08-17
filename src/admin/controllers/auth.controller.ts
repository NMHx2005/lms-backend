import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from '../services/auth.service';

export class AdminAuthController {
  /**
   * Create a new user (admin only)
   */
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAuthService.createUser(req.body);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users with pagination and filters (admin only)
   */
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, search, roles, isActive, createdAtFrom, createdAtTo } = req.query;

      const filters: any = {};
      if (search) filters.search = search as string;
      if (roles) filters.roles = (roles as string).split(',');
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (createdAtFrom || createdAtTo) {
        filters.createdAt = {};
        if (createdAtFrom) filters.createdAt.from = new Date(createdAtFrom as string);
        if (createdAtTo) filters.createdAt.to = new Date(createdAtTo as string);
      }

      const result = await AdminAuthService.getUsers(
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
   * Get user by ID (admin only)
   */
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminAuthService.getUserById(req.params.id);

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

  /**
   * Update user by ID (admin only)
   */
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAuthService.updateUser(req.params.id, req.body);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user by ID (admin only)
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAuthService.deleteUser(req.params.id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate user (admin only)
   */
  static async activateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAuthService.activateUser(req.params.id);

      res.json({
        success: true,
        message: 'User activated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user (admin only)
   */
  static async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminAuthService.deactivateUser(req.params.id);

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update user roles (admin only)
   */
  static async bulkUpdateUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { userIds, roles } = req.body;
      const result = await AdminAuthService.bulkUpdateUserRoles(userIds, roles);

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update user status (admin only)
   */
  static async bulkUpdateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userIds, isActive } = req.body;
      const result = await AdminAuthService.bulkUpdateUserStatus(userIds, isActive);

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics (admin only)
   */
  static async getUserStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const statistics = await AdminAuthService.getUserStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
}
