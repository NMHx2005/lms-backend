import { Request, Response, NextFunction } from 'express';
import { rateLimitConfig, speedLimitConfig } from '../config/security';

// Rate limiting middleware for different route types
export const applyRateLimiting = {
  // General rate limiting for all routes
  general: rateLimitConfig.general,
  
  // Stricter rate limiting for authentication routes
  auth: rateLimitConfig.auth,
  
  // Rate limiting for file uploads
  upload: rateLimitConfig.upload,
  
  // Rate limiting for API endpoints
  api: rateLimitConfig.api,
  
  // Rate limiting for admin routes
  admin: rateLimitConfig.admin,
  
  // Speed limiting for general routes
  speedLimit: speedLimitConfig.general,
  
  // Speed limiting for file uploads
  uploadSpeedLimit: speedLimitConfig.upload,
};

// Dynamic rate limiting based on user role
export const dynamicRateLimiting = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    // Anonymous users get stricter limits
    return rateLimitConfig.auth(req, res, next);
  }
  
  // Admin users get higher limits
  if ((user as any).roles.includes('admin')) {
    return rateLimitConfig.admin(req, res, next);
  }
  
  // Teacher users get moderate limits
  if ((user as any).roles.includes('teacher')) {
    return rateLimitConfig.api(req, res, next);
  }
  
  // Student users get standard limits
  return rateLimitConfig.general(req, res, next);
};

// Rate limiting for specific endpoints
export const endpointRateLimiting = {
  // Login attempts
  login: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per 15 minutes
    message: {
      success: false,
      error: {
        message: 'Too many login attempts, please try again later',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: '15 minutes',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many login attempts, please try again later',
          code: 'LOGIN_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Password reset attempts
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2, // 2 attempts per hour
    message: {
      success: false,
      error: {
        message: 'Too many password reset attempts, please try again later',
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: '1 hour',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many password reset attempts, please try again later',
          code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '1 hour',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Email verification attempts
  emailVerification: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per 15 minutes
    message: {
      success: false,
      error: {
        message: 'Too many email verification attempts, please try again later',
        code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: '15 minutes',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many email verification attempts, please try again later',
          code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Course creation (for teachers)
  courseCreation: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 courses per hour
    message: {
      success: false,
      error: {
        message: 'Too many course creation attempts, please try again later',
        code: 'COURSE_CREATION_RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: '1 hour',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many course creation attempts, please try again later',
          code: 'COURSE_CREATION_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '1 hour',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Assignment submission (for students)
  assignmentSubmission: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 submissions per 15 minutes
    message: {
      success: false,
      error: {
        message: 'Too many assignment submissions, please try again later',
        code: 'ASSIGNMENT_SUBMISSION_RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: '15 minutes',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many assignment submissions, please try again later',
          code: 'ASSIGNMENT_SUBMISSION_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),
};

// Import rateLimit function
import rateLimit from 'express-rate-limit';

export default applyRateLimiting;
