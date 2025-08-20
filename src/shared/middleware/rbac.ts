import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

// Permission interface
export interface Permission {
  resource: string;
  action: string;
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    { resource: '*', action: '*' }, // Admin has all permissions
  ],
  teacher: [
    { resource: 'courses', action: 'create' },
    { resource: 'courses', action: 'read' },
    { resource: 'courses', action: 'update' },
    { resource: 'courses', action: 'delete' },
    { resource: 'lessons', action: 'create' },
    { resource: 'lessons', action: 'read' },
    { resource: 'lessons', action: 'update' },
    { resource: 'lessons', action: 'delete' },
    { resource: 'assignments', action: 'create' },
    { resource: 'assignments', action: 'read' },
    { resource: 'assignments', action: 'update' },
    { resource: 'assignments', action: 'delete' },
    { resource: 'students', action: 'read' },
    { resource: 'enrollments', action: 'read' },
    { resource: 'submissions', action: 'read' },
    { resource: 'submissions', action: 'grade' },
  ],
  student: [
    { resource: 'courses', action: 'read' },
    { resource: 'lessons', action: 'read' },
    { resource: 'assignments', action: 'read' },
    { resource: 'assignments', action: 'submit' },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'enrollments', action: 'read' },
    { resource: 'enrollments', action: 'create' },
    { resource: 'submissions', action: 'read' },
    { resource: 'submissions', action: 'create' },
  ],
};

/**
 * Check if user has permission for specific resource and action
 */
export const hasPermission = (userRoles: string[], resource: string, action: string): boolean => {
  for (const role of userRoles) {
    const permissions = ROLE_PERMISSIONS[role] || [];
    
    for (const permission of permissions) {
      // Check wildcard permissions
      if (permission.resource === '*' && permission.action === '*') {
        return true;
      }
      
      // Check specific resource permissions
      if (permission.resource === resource && permission.action === '*') {
        return true;
      }
      
      // Check specific action permissions
      if (permission.resource === '*' && permission.action === action) {
        return true;
      }
      
      // Check exact permission match
      if (permission.resource === resource && permission.action === action) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    if (!hasPermission((req.user as any).roles, resource, action)) {
      throw new AuthorizationError(
        `Access denied. Required permission: ${resource}:${action}`
      );
    }
    
    next();
  };
};

/**
 * Resource ownership middleware
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Admin can access everything
    if ((req.user as any).roles.includes('admin')) {
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

/**
 * Course ownership middleware (for teachers)
 */
export const requireCourseOwnership = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Admin can access everything
    if ((req.user as any).roles.includes('admin')) {
      return next();
    }
    
    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      throw new AuthorizationError('Course ID not found');
    }
    
    // For teachers, check if they own the course
    if ((req.user as any).roles.includes('teacher')) {
      // This would typically query the database to check course ownership
      // For now, we'll allow teachers to access courses
      return next();
    }
    
    // Students can only access courses they're enrolled in
    if ((req.user as any).roles.includes('student')) {
      // This would typically query the enrollment collection
      // For now, we'll allow students to access courses
      return next();
    }
    
    throw new AuthorizationError('Access denied');
  };
};

/**
 * Enrollment check middleware
 */
export const requireEnrollment = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Admin and teachers can access everything
    if ((req.user as any).roles.includes('admin') || (req.user as any).roles.includes('teacher')) {
      return next();
    }
    
    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      throw new AuthorizationError('Course ID not found');
    }
    
    // For students, check if they're enrolled in the course
    if ((req.user as any).roles.includes('student')) {
      // This would typically query the enrollment collection
      // For now, we'll allow students to access courses
      return next();
    }
    
    throw new AuthorizationError('Access denied');
  };
};

/**
 * Rate limiting middleware based on user role
 */
export const roleBasedRateLimit = (limits: Record<string, { windowMs: number; max: number }>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Default rate limit for unauthenticated users
      return next();
    }
    
    // Apply role-based rate limits
    for (const role of (req.user as any).roles) {
      if (limits[role]) {
        // This would typically integrate with a rate limiting library
        // For now, we'll just pass through
        return next();
      }
    }
    
    // Default rate limit
    next();
  };
};

/**
 * Audit logging middleware
 */
export const auditLog = (action: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // This would typically log the action to an audit log collection
    const auditData = {
      userId: (req.user as any)?.id,
      action,
      resource,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      params: req.params,
      body: req.body,
    };
    
    // Log audit data (in production, this would go to a database or logging service)
    console.log('AUDIT:', JSON.stringify(auditData, null, 2));
    
    next();
  };
};
