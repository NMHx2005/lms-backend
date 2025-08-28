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

  private static calculateExpiryDateFromEnv(expiresIn: string): Date {
    const seconds = this.calculateExpirationTime(expiresIn);
    return new Date(Date.now() + seconds * 1000);
  }

  private static async whitelistRefreshToken(user: any, plainRefreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(plainRefreshToken, this.SALT_ROUNDS);
    const expiresAt = this.calculateExpiryDateFromEnv(this.REFRESH_TOKEN_EXPIRES_IN);

    const tokenRecord = {
      token: hash,
      createdAt: new Date(),
      expiresAt,
    } as any;

    if (!Array.isArray(user.refreshTokens)) {
      user.refreshTokens = [] as any;
    }

    user.refreshTokens.push(tokenRecord);
    // optional: cap number of sessions (e.g., keep last 5)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
  }

  private static async revokeRefreshToken(user: any, plainRefreshToken: string): Promise<boolean> {
    if (!Array.isArray(user.refreshTokens) || user.refreshTokens.length === 0) return false;

    const remaining: any[] = [];
    let removed = false;
    for (const rec of user.refreshTokens) {
      const match = await bcrypt.compare(plainRefreshToken, rec.token).catch(() => false);
      if (match) {
        removed = true; // drop this
        continue;
      }
      remaining.push(rec);
    }
    user.refreshTokens = remaining;
    return removed;
  }

  private static async findValidRefreshToken(user: any, plainRefreshToken: string): Promise<boolean> {
    if (!Array.isArray(user.refreshTokens) || user.refreshTokens.length === 0) return false;
    const now = new Date();
    for (const rec of user.refreshTokens) {
      const notExpired = rec.expiresAt && new Date(rec.expiresAt) > now;
      if (!notExpired) continue;
      const match = await bcrypt.compare(plainRefreshToken, rec.token).catch(() => false);
      if (match) return true;
    }
    return false;
  }

  /**
   * User registration
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const userData = {
      ...data,
      email: data.email.toLowerCase(),
      password: data.password,
      roles: data.roles || ['student'],
      isActive: true,
    };

    const user = new User(userData);
    await user.save();

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

    await this.whitelistRefreshToken(user, refreshToken);
    await user.save();

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

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password refreshTokens password isActive');
    if (!user) {
      console.warn('[AUTH][LOGIN] user not found for email:', email.toLowerCase());
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      console.warn('[AUTH][LOGIN] user inactive:', user._id.toString());
      throw new AuthenticationError('Account is deactivated');
    }

    if (!user.password) {
      console.warn('[AUTH][LOGIN] missing password hash for user:', user._id.toString());
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.warn('[AUTH][LOGIN] password mismatch for user:', user._id.toString());
      throw new AuthenticationError('Invalid email or password');
    }

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

    user.lastLoginAt = new Date();
    await this.whitelistRefreshToken(user, refreshToken);
    await user.save();

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
   * Refresh access token (rotate refresh token)
   */
  static async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const decoded = this.verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId).select('isActive email roles refreshTokens');
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    const exists = await this.findValidRefreshToken(user, refreshToken);
    if (!exists) {
      throw new AuthenticationError('Refresh token invalid or revoked');
    }

    // Rotate: revoke old and issue new
    await this.revokeRefreshToken(user, refreshToken);

    const newAccessToken = this.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    const newRefreshToken = this.generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });

    await this.whitelistRefreshToken(user, newRefreshToken);
    await user.save();

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

    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    user.password = newPassword; // pre-save hook will hash
    await user.save();
  }

  /**
   * Logout (invalidate refresh token)
   */
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    const user = await User.findById(userId).select('refreshTokens');
    if (!user) return;

    if (refreshToken) {
      await this.revokeRefreshToken(user, refreshToken);
      await user.save();
      return;
    }

    // If no token provided, simply update activity (legacy behavior)
    await User.findByIdAndUpdate(userId, { lastActivityAt: new Date() });
  }

  /**
   * Reset password (for admin use)
   */
  static async resetPassword(userId: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    user.password = newPassword;
    await user.save();
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

  static async getUserById(userId: string) {
    return User.findById(userId).select('-password');
  }

  static async updateLastActivity(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      lastActivityAt: new Date(),
    });
  }
}
