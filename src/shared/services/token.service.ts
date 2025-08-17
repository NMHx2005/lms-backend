import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/errors';

// In-memory token blacklist (in production, use Redis or database)
class TokenBlacklist {
  private blacklist: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  add(token: string): void {
    this.blacklist.add(token);
  }

  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  remove(token: string): void {
    this.blacklist.delete(token);
  }

  private cleanup(): void {
    // In a real implementation, you would check token expiration
    // and remove expired tokens from the blacklist
    console.log('Cleaning up token blacklist...');
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

export class TokenService {
  private static blacklist = new TokenBlacklist();

  /**
   * Blacklist a token (for logout)
   */
  static blacklistToken(token: string): void {
    this.blacklist.add(token);
  }

  /**
   * Check if token is blacklisted
   */
  static isTokenBlacklisted(token: string): boolean {
    return this.blacklist.isBlacklisted(token);
  }

  /**
   * Remove token from blacklist (for re-login)
   */
  static removeFromBlacklist(token: string): void {
    this.blacklist.remove(token);
  }

  /**
   * Extract token from request headers or cookies
   */
  static extractToken(req: any): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies
    if (req.cookies?.accessToken) {
      return req.cookies.accessToken;
    }

    return null;
  }

  /**
   * Validate token and check blacklist
   */
  static validateToken(token: string): any {
    // Check if token is blacklisted
    if (this.isTokenBlacklisted(token)) {
      throw new AuthenticationError('Token has been revoked');
    }

    // Verify token signature and expiration
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not defined');
      }

      return jwt.verify(token, secret);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      } else {
        throw new AuthenticationError('Token validation failed');
      }
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration < new Date();
  }

  /**
   * Get time until token expires (in seconds)
   */
  static getTimeUntilExpiration(token: string): number {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return 0;
    }
    return Math.max(0, Math.floor((expiration.getTime() - Date.now()) / 1000));
  }

  /**
   * Refresh token if it's close to expiration
   */
  static shouldRefreshToken(token: string, thresholdMinutes: number = 15): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    const thresholdSeconds = thresholdMinutes * 60;
    return timeUntilExpiration <= thresholdSeconds;
  }

  /**
   * Clean up service resources
   */
  static cleanup(): void {
    this.blacklist.destroy();
  }
}
