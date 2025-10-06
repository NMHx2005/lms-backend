import { AuthService as BaseAuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/models';
import { AuthenticationError, ValidationError, NotFoundError } from '../../shared/utils/errors';

export interface AdminUserCreateData {
  email: string;
  password: string;
  name: string;
  roles: string[];
  isActive?: boolean;
  profile?: {
    avatar?: string;
    phone?: string;
    address?: string;
    country?: string;
    bio?: string;
  };
}

export interface AdminUserUpdateData {
  name?: string;
  roles?: string[];
  isActive?: boolean;
  profile?: {
    avatar?: string;
    phone?: string;
    address?: string;
    country?: string;
    bio?: string;
  };
}

export class AdminAuthService extends BaseAuthService {
  /**
   * Create user by admin
   */
  static async createUser(data: AdminUserCreateData) {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password validation failed', passwordValidation.errors);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const userData = {
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const user = new User(userData);
    await user.save();

    return user;
  }

  /**
   * Update user by admin
   */
  static async updateUser(userId: string, data: AdminUserUpdateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update fields
    if (data.name !== undefined) user.name = data.name;
    if (data.roles !== undefined) user.roles = data.roles as any;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    if (data.profile) {
      (user as any).profile = { ...(user as any).profile, ...data.profile };
    }

    user.updatedAt = new Date();
    await user.save();

    return user;
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.isActive = false;
    user.updatedAt = new Date();
    await user.save();

    return user;
  }

  /**
   * Activate user
   */
  static async activateUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.isActive = true;
    user.updatedAt = new Date();
    await user.save();

    return user;
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete - mark as deleted
    user.isActive = false;
    (user as any).deletedAt = new Date();
    user.updatedAt = new Date();
    await user.save();

    return { message: 'User deleted successfully' };
  }

  /**
   * Get all users with pagination and filters
   */
  static async getUsers(
    page: number = 1,
    limit: number = 10,
    filters: {
      search?: string;
      roles?: string[];
      isActive?: boolean;
      createdAt?: { from?: Date; to?: Date };
    } = {}
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Apply filters
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.roles && filters.roles.length > 0) {
      query.roles = { $in: filters.roles };
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.createdAt) {
      query.createdAt = {};
      if (filters.createdAt.from) query.createdAt.$gte = filters.createdAt.from;
      if (filters.createdAt.to) query.createdAt.$lte = filters.createdAt.to;
    }

    // Exclude deleted users
    query.deletedAt = { $exists: false };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentRegistrations,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: { $exists: false } }),
      User.countDocuments({ isActive: true, deletedAt: { $exists: false } }),
      User.countDocuments({ isActive: false, deletedAt: { $exists: false } }),
      User.aggregate([
        { $match: { deletedAt: { $exists: false } } },
        { $unwind: '$roles' },
        { $group: { _id: '$roles', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.find({ deletedAt: { $exists: false } })
        .select('name email roles createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentRegistrations,
    };
  }

  /**
   * Bulk update user roles
   */
  static async bulkUpdateUserRoles(userIds: string[], roles: string[]) {
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { roles, updatedAt: new Date() } }
    );

    return {
      message: `${result.modifiedCount} users updated successfully`,
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Bulk activate/deactivate users
   */
  static async bulkUpdateUserStatus(userIds: string[], isActive: boolean) {
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive, updatedAt: new Date() } }
    );

    return {
      message: `${result.modifiedCount} users ${isActive ? 'activated' : 'deactivated'} successfully`,
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Get available roles
   */
  static async getRoles(): Promise<string[]> {
    // Return predefined roles for the system
    return [
      'admin',
      'teacher',
      'student',
      'moderator',
      'content_creator',
      'support_staff'
    ];
  }

  /**
   * Get available permissions
   */
  static async getPermissions(): Promise<string[]> {
    // Return predefined permissions for the system
    return [
      'users:read',
      'users:write',
      'users:delete',
      'courses:read',
      'courses:write',
      'courses:delete',
      'courses:moderate',
      'content:moderate',
      'analytics:read',
      'system:admin',
      'reports:read',
      'settings:read',
      'settings:write',
      'billing:read',
      'billing:write',
      'support:read',
      'support:write'
    ];
  }
}
