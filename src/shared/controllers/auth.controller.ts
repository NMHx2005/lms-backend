import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  /**
   * User registration
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, roles } = req.body;

      // Validate password strength
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Password validation failed',
          details: passwordValidation.errors,
        });
      }

      const result = await AuthService.register({
        email,
        password,
        name,
        roles,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Set new refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.user!.id);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate new password strength
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Password validation failed',
          details: passwordValidation.errors,
        });
      }

      await AuthService.changePassword(req.user!.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user password (admin only)
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, newPassword } = req.body;

      // Validate new password strength
      const passwordValidation = AuthService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Password validation failed',
          details: passwordValidation.errors,
        });
      }

      await AuthService.resetPassword(userId, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getUserById(req.user!.id);

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
   * Validate access token
   */
  static async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required',
        });
      }

      const decoded = AuthService.verifyAccessToken(token);
      const user = await AuthService.getUserById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }

      res.json({
        success: true,
        data: {
          isValid: true,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            roles: user.roles,
            isActive: user.isActive,
          },
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  }
}
