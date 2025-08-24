import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../shared/models';
import { AuthenticationError, AuthorizationError } from '../../shared/utils/errors';

// Note: Global Express interface extension is defined in shared/types/global.ts

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
    const user = await User.findById(decoded.userId).select('+isActive firstName lastName role isActive');
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    
    // Check if user is active (default to true if undefined)
    console.log(user);
    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }
    
    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
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
    
    // ✅ Kiểm tra cả role (string) và roles (array)
    const userRole = (req.user as any).role;
    const userRoles = (req.user as any).roles;
    
    let hasRole = false;
    
    // Kiểm tra role (string)
    if (userRole && allowedRoles.includes(userRole)) {
      hasRole = true;
    }
    
    // Kiểm tra roles (array) nếu có
    if (!hasRole && userRoles && Array.isArray(userRoles)) {
      hasRole = userRoles.some((role: string) => allowedRoles.includes(role));
    }
    
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
      const user = await User.findById(decoded.userId).select('+isActive firstName lastName role');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          roles: user.roles,
          isActive: user.isActive,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
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
    
    // ✅ Kiểm tra cả role (string) và roles (array)
    const userRole = (req.user as any).role;
    const userRoles = (req.user as any).roles;
    
    let isAdmin = false;
    
    // Kiểm tra role (string)
    if (userRole === 'admin') {
      isAdmin = true;
    }
    
    // Kiểm tra roles (array) nếu có
    if (!isAdmin && userRoles && Array.isArray(userRoles)) {
      isAdmin = userRoles.includes('admin');
    }
    
    // Admin can access everything
    if (isAdmin) {
      return next();
    }
    
    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      throw new AuthorizationError('Resource user ID not found');
    }
    
    if ((req.user as any).id !== resourceUserId) {
      throw new AuthorizationError('Access denied. You can only access your own resources');
    }
    
    next();
  };
};
