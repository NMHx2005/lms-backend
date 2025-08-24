import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

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
    expiresIn: process.env.JWT_REFRESH_SECRET || '7d',
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
      throw new AuthenticationError('No token provided');
    }
    
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('email roles isActive firstName lastName role');
    
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
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication middleware
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('email roles isActive firstName lastName role');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          roles: user.roles,
          isActive: user.isActive,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization middleware
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
  
  if (!isAdmin) {
    throw new AuthorizationError('Admin access required');
  }
  
  next();
};

export const requireTeacher = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  
  // ✅ Kiểm tra an toàn: roles phải tồn tại và là array
  const userRoles = (req.user as any).roles;
  if (!userRoles || !Array.isArray(userRoles)) {
    throw new AuthorizationError('User roles not found or invalid');
  }
  
  if (!userRoles.includes('teacher') && !userRoles.includes('admin')) {
    throw new AuthorizationError('Teacher access required');
  }
  
  next();
};

export const requireStudent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  
  // ✅ Kiểm tra an toàn: roles phải tồn tại và là array
  const userRoles = (req.user as any).roles;
  if (!userRoles || !Array.isArray(userRoles)) {
    throw new AuthorizationError('User roles not found or invalid');
  }
  
  if (!userRoles.includes('student') && !userRoles.includes('teacher') && !userRoles.includes('admin')) {
    throw new AuthorizationError('Student access required');
  }
  
  next();
};

// Permission-based authorization middleware
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // ✅ Kiểm tra an toàn: roles phải tồn tại và là array
    const userRoles = (req.user as any).roles;
    if (!userRoles || !Array.isArray(userRoles)) {
      throw new AuthorizationError('User roles not found or invalid');
    }
    
    // Import from rbac middleware
    const { hasPermission } = require('./rbac');
    
    if (!hasPermission(userRoles, resource, action)) {
      throw new AuthorizationError(
        `Access denied. Required permission: ${resource}:${action}`
      );
    }
    
    next();
  };
};

// Resource ownership middleware
export const requireOwnership = (resourceModel: any, resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const resourceId = req.params[resourceIdParam];
    const resource = await resourceModel.findById(resourceId);
    
    if (!resource) {
      throw new AuthorizationError('Resource not found');
    }
    
    // ✅ Kiểm tra an toàn: roles phải tồn tại và là array
    const userRoles = (req.user as any).roles;
    if (!userRoles || !Array.isArray(userRoles)) {
      throw new AuthorizationError('User roles not found or invalid');
    }
    
    // Check if user owns the resource or is admin
    if (resource.userId?.toString() !== (req.user as any).id && !userRoles.includes('admin')) {
      throw new AuthorizationError('Access denied to this resource');
    }
    
    next();
  };
};

// Course ownership middleware
export const requireCourseOwnership = (courseIdParam: string = 'courseId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const courseId = req.params[courseIdParam];
    const Course = require('../models').Course;
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw new AuthorizationError('Course not found');
    }
    
    // ✅ Kiểm tra an toàn: roles phải tồn tại và là array
    const userRoles = (req.user as any).roles;
    if (!userRoles || !Array.isArray(userRoles)) {
      throw new AuthorizationError('User roles not found or invalid');
    }
    
    // Check if user owns the course or is admin
    if (course.instructorId?.toString() !== (req.user as any).id && !userRoles.includes('admin')) {
      throw new AuthorizationError('Access denied to this course');
    }
    
    next();
  };
};

// Enrollment middleware
export const requireEnrollment = (courseIdParam: string = 'courseId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const courseId = req.params[courseIdParam];
    const Enrollment = require('../models').Enrollment;
    const enrollment = await Enrollment.findOne({
      studentId: (req.user as any).id,
      courseId,
      isActive: true
    });
    
    // ✅ Kiểm tra an toàn: roles phải tồn tại và là array
    const userRoles = (req.user as any).roles;
    if (!userRoles || !Array.isArray(userRoles)) {
      throw new AuthorizationError('User roles not found or invalid');
    }
    
    if (!enrollment && !userRoles.includes('admin') && !userRoles.includes('teacher')) {
      throw new AuthorizationError('Enrollment required for this course');
    }
    
    next();
  };
};
