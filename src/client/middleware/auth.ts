import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../shared/models';
import { AuthenticationError, AuthorizationError } from '../../shared/utils/errors';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
        isActive: boolean;
      };
    }
  }
}

// JWT token interface
interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Generate JWT token
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const options: any = {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  };
  
  return jwt.sign(payload, secret, options);
};

// Generate refresh token
export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  
  const options: any = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
  
  return jwt.sign(payload, secret, options);
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
};

// Extract token from request
const extractToken = (req: Request): string | null => {
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
};

// Main authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthenticationError('Access token required');
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('+isActive');
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }
    
    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasRole) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }
    
    next();
  };
};

// Specific role middlewares
export const requireAdmin = authorize('admin');
export const requireTeacher = authorize('teacher');
export const requireStudent = authorize('student');
export const requireAdminOrTeacher = authorize('admin', 'teacher');

// Optional authentication (doesn't throw error if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('+isActive');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          roles: user.roles,
          isActive: user.isActive,
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user owns resource or is admin
export const checkOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Admin can access everything
    if (req.user.roles.includes('admin')) {
      return next();
    }
    
    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      throw new AuthorizationError('Resource user ID not found');
    }
    
    if (req.user.id !== resourceUserId) {
      throw new AuthorizationError('Access denied. You can only access your own resources');
    }
    
    next();
  };
};
