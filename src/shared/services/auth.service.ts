import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthenticationError, ValidationError } from '../utils/errors';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  roles?: string[];
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: { userId: string; email: string; roles: string[] }): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(payload, secret, { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN } as any);
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(payload: { userId: string; email: string; roles: string[] }): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    return jwt.sign(payload, secret, { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN } as any);
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token: string): any {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  /**
   * User registration
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user with default role if not specified
    const userData = {
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      roles: data.roles || ['student'],
      isActive: true,
    };

    const user = new User(userData);
    await user.save();

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    // Calculate expiration time
    const expiresIn = this.calculateExpirationTime(this.ACCESS_TOKEN_EXPIRES_IN);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        isActive: user.isActive,
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * User login
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Calculate expiration time
    const expiresIn = this.calculateExpirationTime(this.ACCESS_TOKEN_EXPIRES_IN);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        isActive: user.isActive,
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('isActive');
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken({
      userId: user._id.toString(),
      email: decoded.email,
      roles: decoded.roles,
    });

    const newRefreshToken = this.generateRefreshToken({
      userId: user._id.toString(),
      email: decoded.email,
      roles: decoded.roles,
    });

    // Calculate expiration time
    const expiresIn = this.calculateExpirationTime(this.ACCESS_TOKEN_EXPIRES_IN);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();
  }

  /**
   * Reset password (for admin use)
   */
  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();
  }

  /**
   * Logout (invalidate refresh token)
   */
  static async logout(userId: string): Promise<void> {
    // In a real application, you might want to blacklist the refresh token
    // For now, we'll just update the last activity
    await User.findByIdAndUpdate(userId, {
      lastActivityAt: new Date(),
    });
  }

  /**
   * Calculate token expiration time in seconds
   */
  private static calculateExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 86400; // Default to 1 day
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 86400;
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get user by ID (for internal use)
   */
  static async getUserById(userId: string) {
    return User.findById(userId).select('-password');
  }

  /**
   * Update user last activity
   */
  static async updateLastActivity(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      lastActivityAt: new Date(),
    });
  }
}
