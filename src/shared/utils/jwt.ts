import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface JWTPayload {
  userId: Types.ObjectId | string;
  email: string;
  roles: string[];
  authProvider?: string;
  iat?: number;
  exp?: number;
}

export interface TokenResult {
  token: string;
  expiresIn: number;
  expiresAt: Date;
}

export interface RefreshTokenData {
  token: string;
  userId: Types.ObjectId | string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Generate JWT token
 */
export function generateJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = '1h'
): TokenResult {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const token = jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'lms-backend',
    audience: 'lms-users'
  } as jwt.SignOptions);

  // Calculate expiration time
  const expiresInSeconds = parseExpiresIn(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return {
    token,
    expiresIn: expiresInSeconds,
    expiresAt
  };
}

/**
 * Verify JWT token
 */
export function verifyJWT(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'lms-backend',
      audience: 'lms-users'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.NotBeforeError) {
      throw new Error('Token not active');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(
  userId: Types.ObjectId | string,
  expiresIn: string = '30d'
): RefreshTokenData {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET environment variable is not set');
  }

  const payload = { userId, type: 'refresh' };
  const token = jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'lms-backend',
    audience: 'lms-users'
  } as jwt.SignOptions);

  const expiresInSeconds = parseExpiresIn(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return {
    token,
    userId,
    expiresAt
  };
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: Types.ObjectId | string } {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'lms-backend',
      audience: 'lms-users'
    }) as { userId: Types.ObjectId | string; type: string };

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
}

/**
 * Generate access token from refresh token
 */
export function generateAccessTokenFromRefresh(
  refreshToken: string,
  userData: Omit<JWTPayload, 'iat' | 'exp'>
): TokenResult {
  // Verify refresh token first
  const { userId } = verifyRefreshToken(refreshToken);

  // Generate new access token
  return generateJWT({
    ...userData,
    userId
  }, '1h');
}

/**
 * Parse expiresIn string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid expiresIn format. Use format like "1h", "30m", "7d"');
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: throw new Error('Invalid time unit');
  }
}

/**
 * Generate short-lived token for email verification, password reset, etc.
 */
export function generateShortLivedToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  purpose: 'email_verification' | 'password_reset' | 'two_factor' | 'invitation',
  expiresIn: string = '15m'
): TokenResult {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const enhancedPayload = {
    ...payload,
    purpose,
    type: 'short_lived'
  };

  const token = jwt.sign(enhancedPayload, secret, {
    expiresIn,
    issuer: 'lms-backend',
    audience: 'lms-users'
  } as jwt.SignOptions);

  const expiresInSeconds = parseExpiresIn(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return {
    token,
    expiresIn: expiresInSeconds,
    expiresAt
  };
}

/**
 * Verify short-lived token
 */
export function verifyShortLivedToken(
  token: string,
  expectedPurpose: 'email_verification' | 'password_reset' | 'two_factor' | 'invitation'
): JWTPayload & { purpose: string; type: string } {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'lms-backend',
      audience: 'lms-users'
    }) as JWTPayload & { purpose: string; type: string };

    if (decoded.type !== 'short_lived') {
      throw new Error('Invalid token type');
    }

    if (decoded.purpose !== expectedPurpose) {
      throw new Error('Token purpose mismatch');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
}

/**
 * Generate API key token for service-to-service communication
 */
export function generateAPIKey(
  serviceName: string,
  permissions: string[],
  expiresIn: string = '1y'
): TokenResult {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = {
    serviceName,
    permissions,
    type: 'api_key',
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'lms-backend',
    audience: 'lms-services'
  } as jwt.SignOptions);

  const expiresInSeconds = parseExpiresIn(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return {
    token,
    expiresIn: expiresInSeconds,
    expiresAt
  };
}

/**
 * Verify API key token
 */
export function verifyAPIKey(token: string): {
  serviceName: string;
  permissions: string[];
  type: string;
} {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'lms-backend',
      audience: 'lms-services'
    }) as {
      serviceName: string;
      permissions: string[];
      type: string;
    };

    if (decoded.type !== 'api_key') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('API key has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid API key');
    } else {
      throw error;
    }
  }
}
