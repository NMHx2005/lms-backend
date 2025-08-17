import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../../shared/middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    isActive: boolean;
  };
}

export class ClientUserController {
  /**
   * Get user profile
   */
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await UserService.getUserProfile(req.user!.id);
    
    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Update user profile
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  static requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
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
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
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
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
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
  static resendEmailVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await UserService.resendEmailVerification(req.user!.id);
    
    res.json({
      success: true,
      message: 'Email verification sent successfully'
    });
  });

  /**
   * Update user preferences
   */
  static updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  static updateNotificationSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  static getLearningStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await UserService.getUserLearningStats(req.user!.id);
    
    res.json({
      success: true,
      data: stats
    });
  });

  /**
   * Get user activity log
   */
  static getActivityLog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
   * Update user avatar
   */
  static updateAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  static deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  static getSubscriptionInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await UserService.getUserSubscriptionInfo(req.user!.id);
    
    res.json({
      success: true,
      data: subscription
    });
  });

  /**
   * Update user social links
   */
  static updateSocialLinks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { socialLinks } = req.body;
    
    const user = await UserService.updateUserSocialLinks(req.user!.id, socialLinks);
    
    res.json({
      success: true,
      message: 'Social links updated successfully',
      data: user.socialLinks
    });
  });
}

export default ClientUserController;
