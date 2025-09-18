import bcrypt from 'bcryptjs';
import { User as UserModel } from '../../shared/models';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,
  UserStats,
  UserSearchFilters,
  User
} from '../interfaces/user.interface';
import { DEFAULT_USER_LIMIT, USER_SORT_FIELDS, USER_SORT_ORDERS } from '../constants/user.constants';
import { CloudinaryService } from '../../shared/services/cloudinaryService';

export class UserService {
  // Create a new user
  static async createUser(userData: CreateUserRequest) {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = new UserModel({
      ...userData,
      password: hashedPassword,
      isActive: true
    });

    return await user.save();
  }

  // Get user by ID
  static async getUserById(userId: string) {
    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Get users with pagination and filters
  static async getUsers(
    page: number = 1,
    limit: number = DEFAULT_USER_LIMIT,
    sortBy: string = USER_SORT_FIELDS.CREATED_AT,
    sortOrder: string = USER_SORT_ORDERS.DESC,
    filters: UserSearchFilters = {}
  ): Promise<UserListResponse> {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.roles && filters.roles.length > 0) {
      query.roles = { $in: filters.roles };
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.createdAt) {
      query.createdAt = {
        $gte: filters.createdAt.start,
        $lte: filters.createdAt.end
      };
    }

    if (filters.lastActivityAt) {
      query.lastActivityAt = {
        $gte: filters.lastActivityAt.start,
        $lte: filters.lastActivityAt.end
      };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === USER_SORT_ORDERS.ASC ? 1 : -1;

    // Execute query
    const [usersData, total] = await Promise.all([
      UserModel.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(query)
    ]);

    // Map to match User interface
    const users: User[] = usersData.map(user => ({
      _id: user._id.toString(),
      email: user.email,
      name: user.name || '',
      roles: user.roles || [],
      isActive: user.isActive || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActivityAt: user.lastActivityAt,
      avatar: user.avatar,
      phone: user.phone,
      country: user.country,
      bio: user.bio,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      emailVerified: user.emailVerified,
      dateOfBirth: user.dateOfBirth,
      socialLinks: user.socialLinks,
      preferences: user.preferences,
      stats: user.stats,
      lastLoginAt: user.lastLoginAt
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Update user
  static async updateUser(userId: string, updateData: UpdateUserRequest) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user
    Object.assign(user, updateData);
    user.updatedAt = new Date();

    return await user.save();
  }

  // Delete user
  static async deleteUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has any dependencies (courses, enrollments, etc.)
    // This would need to be implemented based on your business logic

    await UserModel.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }

  // Get user statistics
  static async getUserStats(): Promise<UserStats> {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      newUsersThisMonth,
      activeUsersThisWeek
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ isActive: false }),
      UserModel.aggregate([
        { $unwind: '$roles' },
        { $group: { _id: '$roles', count: { $sum: 1 } } }
      ]),
      UserModel.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      UserModel.countDocuments({
        lastActivityAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: usersByRole.map(item => ({ role: item._id, count: item.count })),
      newUsersThisMonth,
      activeUsersThisWeek
    };
  }

  // Bulk update user status
  static async bulkUpdateUserStatus(userIds: string[], isActive: boolean) {
    const result = await UserModel.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive, updatedAt: new Date() } }
    );

    return {
      message: `Updated ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    };
  }

  // Search users by email or name
  static async searchUsers(searchTerm: string, limit: number = 10) {
    const users = await UserModel.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } }
      ]
    })
      .select('-password')
      .limit(limit);

    return users;
  }

  // Activate user
  static async activateUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = true;
    user.updatedAt = new Date();
    return await user.save();
  }

  // Deactivate user
  static async deactivateUser(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = false;
    user.updatedAt = new Date();
    return await user.save();
  }

  // Bulk update user roles
  static async bulkUpdateUserRoles(userIds: string[], roles: string[]) {
    const result = await UserModel.updateMany(
      { _id: { $in: userIds } },
      { $set: { roles, updatedAt: new Date() } }
    );

    return {
      message: `Updated ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
    };
  }

  // Update user avatar
  static async updateUserAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    // Upload to Cloudinary
    const result = await CloudinaryService.uploadFile(file, {
      folder: 'avatars',
      resourceType: 'image'
    });

    // Update user avatar
    await UserModel.findByIdAndUpdate(userId, {
      avatar: result.secureUrl,
      updatedAt: new Date()
    });

    return result.secureUrl;
  }
}
