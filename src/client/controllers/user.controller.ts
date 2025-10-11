import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../../shared/utils/asyncHandler';

// Import AuthenticatedRequest from shared types
import { AuthenticatedRequest } from '../../shared/types/global';

export class ClientUserController {
  /**
   * Get user profile
   */
  static getProfile = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const user = await UserService.getUserProfile(req.user!.id);

    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const updateData = req.body;
    const user = await UserService.updateUserProfile(req.user!.id, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await UserService.changePassword(req.user!.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * Request password reset
   */
  static requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    await UserService.requestPasswordReset(email);

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  });

  /**
   * Reset password with token
   */
  static resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    await UserService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  });

  /**
   * Verify email with token
   */
  static verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    await UserService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  /**
   * Resend email verification
   */
  static resendEmailVerification = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    await UserService.resendEmailVerification(req.user!.id);

    res.json({
      success: true,
      message: 'Email verification sent successfully'
    });
  });

  /**
   * Update user preferences
   */
  static updatePreferences = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { preferences } = req.body;

    const user = await UserService.updateUserPreferences(req.user!.id, preferences);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });
  });

  /**
   * Update notification settings
   */
  static updateNotificationSettings = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { notifications } = req.body;

    const user = await UserService.updateNotificationSettings(req.user!.id, notifications);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: user.preferences?.notifications
    });
  });

  /**
   * Get user learning statistics
   */
  static getLearningStats = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const stats = await UserService.getUserLearningStats(req.user!.id);

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Get user activity log
   */
  static getActivityLog = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const activities = await UserService.getUserActivityLog(
      req.user!.id,
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: activities
    });
  });

  /**
   * Get user activity summary
   */
  static getActivitySummary = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const days = Number((req.query?.days as any) || 30);
    const data = await (UserService as any).getUserActivitySummary(req.user!.id, days);
    res.json({ success: true, data });
  });

  /**
   * Update user avatar
   */
  static updateAvatar = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Avatar file is required'
      });
    }

    const avatar = await UserService.updateUserAvatar(req.user!.id, req.file);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatar }
    });
  });

  /**
   * Delete user account
   */
  static deleteAccount = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { password } = req.body;

    await UserService.deleteUserAccount(req.user!.id, password);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  });

  /**
   * Get user subscription info
   */
  static getSubscriptionInfo = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const subscription = await UserService.getUserSubscriptionInfo(req.user!.id);

    res.json({
      success: true,
      data: subscription
    });
  });

  /**
   * Update user social links
   */
  static updateSocialLinks = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { socialLinks } = req.body;

    const user = await UserService.updateUserSocialLinks(req.user!.id, socialLinks);

    res.json({
      success: true,
      message: 'Social links updated successfully',
      data: user.socialLinks
    });
  });

  /**
   * Update user bio
   */
  static updateBio = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { bio } = req.body;

    const user = await UserService.updateUserProfile(req.user!.id, { bio });

    res.json({
      success: true,
      message: 'Bio updated successfully',
      data: { bio: user.bio }
    });
  });

  /**
   * Update user skills
   */
  static updateSkills = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { skills } = req.body;

    const user = await UserService.updateUserProfile(req.user!.id, { skills });

    res.json({
      success: true,
      message: 'Skills updated successfully',
      data: { skills: user.skills }
    });
  });

  /**
   * Update user education
   */
  static updateEducation = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { education } = req.body;

    const user = await UserService.updateUserProfile(req.user!.id, { education });

    res.json({
      success: true,
      message: 'Education updated successfully',
      data: { education: user.education }
    });
  });

  /**
   * Update user experience
   */
  static updateExperience = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { experience } = req.body;

    const user = await UserService.updateUserProfile(req.user!.id, { experience });

    res.json({
      success: true,
      message: 'Experience updated successfully',
      data: { experience: user.experience }
    });
  });

  /**
   * Get profile stats (for teachers)
   */
  static getProfileStats = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const stats = await UserService.getProfileStats(req.user!.id);

    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Get course quota info (for teachers)
   */
  static getCourseQuota = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const quota = await UserService.getCourseQuota(req.user!.id);

    res.json({
      success: true,
      data: quota
    });
  });
}

export default ClientUserController;
