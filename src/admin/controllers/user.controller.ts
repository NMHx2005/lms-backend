import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  // Create a new user
  static async createUser(req: Request, res: Response) {
    try {
      const userData = req.body;
      const user = await UserService.createUser(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create user'
      });
    }
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {

      res.status(404).json({
        success: false,
        error: error.message || 'User not found'
      });
    }
  }

  // Get all users with pagination and filters
  static async getUsers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        roles,
        isActive
      } = req.query;

      // Parse filters
      const filters: any = {};
      if (search) filters.search = search as string;
      if (roles) {
        // Handle both string and array for roles
        if (Array.isArray(roles)) {
          filters.roles = roles;
        } else if (typeof roles === 'string') {
          // Split comma-separated string or use single value
          filters.roles = roles.includes(',') ? roles.split(',').map(r => r.trim()) : [roles];
        }
      }
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const result = await UserService.getUsers(
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
        error: error.message || 'Failed to get users'
      });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await UserService.updateUser(id, updateData);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update user'
      });
    }
  }

  // Delete user
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete user'
      });
    }
  }

  // Get user statistics
  static async getUserStats(req: Request, res: Response) {
    try {
      const stats = await UserService.getUserStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user statistics'
      });
    }
  }

  // Bulk update user status
  static async bulkUpdateUserStatus(req: Request, res: Response) {
    try {
      const { userIds, isActive } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'userIds must be a non-empty array'
        });
      }

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isActive must be a boolean value'
        });
      }

      const result = await UserService.bulkUpdateUserStatus(userIds, isActive);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to bulk update user status'
      });
    }
  }

  // Search users
  static async searchUsers(req: Request, res: Response) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const users = await UserService.searchUsers(q, Number(limit));

      res.json({
        success: true,
        data: users
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search users'
      });
    }
  }

  // Activate user
  static async activateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.activateUser(id);

      res.json({
        success: true,
        message: 'User activated successfully',
        data: result
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to activate user'
      });
    }
  }

  // Deactivate user
  static async deactivateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.deactivateUser(id);

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: result
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to deactivate user'
      });
    }
  }

  // Bulk update user roles
  static async bulkUpdateUserRoles(req: Request, res: Response) {
    try {
      const { userIds, roles } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'userIds must be a non-empty array'
        });
      }

      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'roles must be a non-empty array'
        });
      }

      const result = await UserService.bulkUpdateUserRoles(userIds, roles);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to bulk update user roles'
      });
    }
  }

  // Update user avatar
  static async updateUserAvatar(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Avatar file is required'
        });
      }

      const avatar = await UserService.updateUserAvatar(id, req.file);

      res.json({
        success: true,
        message: 'Avatar updated successfully',
        data: { avatar }
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update avatar'
      });
    }
  }
}
