import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User as UserModel, UserActivityLog as ActivityLogModel } from '../../shared/models';
import {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdatePreferencesRequest,
  UpdateNotificationSettingsRequest,
  UpdateSocialLinksRequest,
  UserProfile,
  UserLearningStats,
  UserActivityLog,
  UserSubscriptionInfo
} from '../interfaces/user.interface';
import { CloudinaryService } from '../../shared/services/cloudinaryService';

export class UserService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await UserModel.findById(userId)
      .select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user.toObject();
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updateData: UpdateProfileRequest): Promise<UserProfile> {
    const allowedFields = [
      'name', 'bio', 'phone', 'dateOfBirth', 'country',
      'avatar', 'socialLinks', 'preferences', 'skills', 'education', 'experience'
    ];

    const filteredData: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key as keyof UpdateProfileRequest];
      }
    });

    const user = await UserModel.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user.toObject();
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await UserModel.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user (using any to bypass TypeScript)
    (user as any).resetPasswordToken = resetToken;
    (user as any).resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send reset email (commented out for now)
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await EmailService.sendPasswordResetEmail(user.email, resetUrl);
    console.log(`Password reset email would be sent to ${user.email} with token: ${resetToken}`);
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    } as any);

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpires = undefined;
    await user.save();
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<void> {
    const user = await UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    } as any);

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified
    user.emailVerified = true;
    (user as any).emailVerificationToken = undefined;
    (user as any).emailVerificationExpires = undefined;
    await user.save();
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save verification token
    (user as any).emailVerificationToken = verificationToken;
    (user as any).emailVerificationExpires = verificationExpiry;
    await user.save();

    // Send verification email (commented out for now)
    // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    // await EmailService.sendEmailVerification(user.email, verificationUrl);
    console.log(`Email verification would be sent to ${user.email} with token: ${verificationToken}`);
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(userId: string, preferences: UpdatePreferencesRequest): Promise<any> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(userId: string, notifications: any): Promise<any> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 'preferences.notifications': notifications },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get user learning statistics
   */
  static async getUserLearningStats(userId: string): Promise<UserLearningStats> {
    const user = await UserModel.findById(userId)
      .populate('enrolledCourses', 'progress')
      .populate('completedCourses', 'completedAt')
      .populate('assignments', 'score submittedAt');

    if (!user) {
      throw new Error('User not found');
    }

    const stats = {
      totalCoursesEnrolled: user.stats?.totalCoursesEnrolled || 0,
      totalCoursesCompleted: user.stats?.totalCoursesCompleted || 0,
      totalAssignmentsSubmitted: user.stats?.totalAssignmentsSubmitted || 0,
      averageScore: user.stats?.averageScore || 0,
      totalLearningTime: user.stats?.totalLearningTime || 0,
      currentStreak: 0, // Calculate from activity log
      totalCertificates: 0, // Calculate from completed courses
      favoriteCategories: [], // Calculate from enrolled courses
      learningGoals: (user.preferences as any)?.learningGoals || []
    };

    return stats;
  }

  /**
   * Get user activity log
   */
  static async getUserActivityLog(userId: string, page: number = 1, limit: number = 20): Promise<UserActivityLog> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      (ActivityLogModel as any).find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      (ActivityLogModel as any).countDocuments({ userId })
    ]);
    const activities = items.map((i: any) => ({
      id: String(i._id),
      type: i.action,
      description: `${i.action} ${i.resource}`,
      timestamp: i.createdAt,
      metadata: { resource: i.resource, resourceId: i.resourceId, courseId: i.courseId, lessonId: i.lessonId, duration: i.duration }
    }));
    return {
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    } as any;
  }

  static async getUserActivitySummary(userId: string, days: number = 30) {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 3600 * 1000);
    const summary = await (ActivityLogModel as any).getUserActivitySummary(userId as any, start, end);
    return { range: { start, end }, summary } as any;
  }

  /**
   * Update user avatar
   */
  static async updateUserAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    // Upload to Cloudinary
    const result = await CloudinaryService.uploadFile(file, {
      folder: 'avatars',
      resourceType: 'image'
    });

    // Update user avatar
    await UserModel.findByIdAndUpdate(userId, { avatar: result.secureUrl });

    return result.secureUrl;
  }

  /**
   * Delete user account
   */
  static async deleteUserAccount(userId: string, password: string): Promise<void> {
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Password is incorrect');
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    (user as any).deletedAt = new Date();
    await user.save();
  }

  /**
   * Get user subscription info
   */
  static async getUserSubscriptionInfo(userId: string): Promise<UserSubscriptionInfo> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      plan: user.subscriptionPlan,
      expiresAt: user.subscriptionExpiresAt,
      isActive: user.subscriptionExpiresAt ? user.subscriptionExpiresAt > new Date() : false,
      features: this.getPlanFeatures(user.subscriptionPlan),
      nextBillingDate: user.subscriptionExpiresAt,
      autoRenew: true // This would come from payment system
    };
  }

  /**
   * Update user social links
   */
  static async updateUserSocialLinks(userId: string, socialLinks: UpdateSocialLinksRequest): Promise<any> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { socialLinks },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get plan features based on subscription plan
   */
  private static getPlanFeatures(plan: string): string[] {
    switch (plan) {
      case 'free':
        return ['Basic courses', 'Limited assignments', 'Community support'];
      case 'pro':
        return ['All courses', 'Unlimited assignments', 'Priority support', 'Certificates'];
      case 'advanced':
        return ['All courses', 'Unlimited assignments', 'Priority support', 'Certificates', '1-on-1 mentoring'];
      default:
        return ['Basic courses', 'Limited assignments', 'Community support'];
    }
  }

  /**
   * Get profile stats for teachers
   */
  static async getProfileStats(userId: string) {
    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    // Get courses created by teacher (if teacher)
    let coursesCreated = 0;
    let totalStudents = 0;
    let totalRevenue = 0;
    let totalSubscriptions = 0;
    let activeSubscriptions = 0;

    if (user.roles?.includes('teacher')) {
      const { Course, Bill } = require('../../shared/models');
      const { TeacherPackageSubscription } = require('../../shared/models/extended/TeacherPackage');
      const mongoose = require('mongoose');
      const teacherObjectId = new mongoose.Types.ObjectId(userId);

      // Get courses
      const courses = await Course.find({ instructorId: teacherObjectId });
      coursesCreated = courses.length;
      totalStudents = courses.reduce((sum: number, c: any) => sum + (c.totalStudents || 0), 0);

      // Calculate revenue from Bills (actual payments from students)
      const revenueResult = await Bill.aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        {
          $match: {
            'course.instructorId': teacherObjectId,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      totalRevenue = revenueResult[0]?.total || 0;

      // Get subscription packages count
      totalSubscriptions = await TeacherPackageSubscription.countDocuments({
        teacherId: teacherObjectId
      });

      activeSubscriptions = await TeacherPackageSubscription.countDocuments({
        teacherId: teacherObjectId,
        status: 'active',
        endAt: { $gt: new Date() }
      });
    }

    return {
      profileCompletion: this.calculateProfileCompletion(user),
      coursesCreated,
      totalStudents,
      totalRevenue,
      totalSubscriptions,
      activeSubscriptions,
      joinedDate: user.createdAt,
      lastActive: user.lastActivityAt || user.lastLoginAt,
      subscriptionStatus: user.subscriptionPlan || 'free'
    };
  }

  /**
   * Get course quota info for teachers
   */
  static async getCourseQuota(userId: string) {
    const { Course } = require('../../shared/models');
    const { TeacherPackageSubscription } = require('../../shared/models/extended/TeacherPackage');
    const mongoose = require('mongoose');
    const teacherObjectId = new mongoose.Types.ObjectId(userId);

    // Get all active subscriptions
    const activeSubscriptions = await TeacherPackageSubscription.find({
      teacherId: teacherObjectId,
      status: 'active',
      endAt: { $gt: new Date() }
    }).populate('packageId', 'name maxCourses');

    // Get current courses count
    const currentCoursesCount = await Course.countDocuments({
      instructorId: teacherObjectId
    });

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return {
        hasActiveSubscription: false,
        currentCourses: currentCoursesCount,
        maxCourses: 0,
        remainingCourses: 0,
        canCreateCourse: false,
        activePackages: []
      };
    }

    // Get the subscription with highest maxCourses limit
    const maxAllowed = Math.max(...activeSubscriptions.map((sub: any) => sub.snapshot?.maxCourses || 0));
    const remainingCourses = Math.max(0, maxAllowed - currentCoursesCount);

    return {
      hasActiveSubscription: true,
      currentCourses: currentCoursesCount,
      maxCourses: maxAllowed,
      remainingCourses,
      canCreateCourse: currentCoursesCount < maxAllowed,
      activePackages: activeSubscriptions.map((sub: any) => ({
        name: sub.snapshot?.name,
        maxCourses: sub.snapshot?.maxCourses,
        endAt: sub.endAt
      }))
    };
  }

  /**
   * Calculate profile completion percentage
   */
  private static calculateProfileCompletion(user: any): number {
    const fields = [
      user.name,
      user.email,
      user.bio,
      user.avatar,
      user.phone,
      user.dateOfBirth,
      user.country,
      user.skills && user.skills.length > 0,
      user.education && user.education.length > 0,
      user.experience && user.experience.length > 0
    ];

    const filledFields = fields.filter(field => field).length;
    return Math.round((filledFields / fields.length) * 100);
  }
}

export default UserService;
