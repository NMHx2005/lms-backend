import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { handleValidationErrors as commonHandleValidationErrors } from '../validators/common.validator';

/**
 * Generic middleware for processing express-validator results
 * @param validations Array of validation rules
 * @returns Middleware function
 */
export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: (error as any).value,
      }));
      return next(new ValidationError('Validation failed', errorMessages));
    }
    next();
  };
};

/**
 * Enhanced validation middleware with custom error handling
 * @param validations Array of validation rules
 * @param customErrorHandler Optional custom error handler
 * @returns Middleware function
 */
export const validateRequestWithCustomHandler = (
  validations: any[],
  customErrorHandler?: (errors: any[], req: Request, res: Response, next: NextFunction) => void
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (customErrorHandler) {
        return customErrorHandler(errors.array(), req, res, next);
      }
      return commonHandleValidationErrors(req, res, next);
    }
    next();
  };
};

/**
 * Conditional validation middleware
 * @param condition Function that returns boolean based on request
 * @param validations Array of validation rules
 * @returns Middleware function
 */
export const validateConditionally = (
  condition: (req: Request) => boolean,
  validations: any[]
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return validateRequest(validations)(req, res, next);
    }
    next();
  };
};

/**
 * Validate only specific fields based on request method
 * @param validations Object with HTTP methods as keys and validation arrays as values
 * @returns Middleware function
 */
export const validateByMethod = (validations: Record<string, any[]>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toLowerCase();
    const methodValidations = validations[method] || [];
    
    if (methodValidations.length > 0) {
      return validateRequest(methodValidations)(req, res, next);
    }
    next();
  };
};

/**
 * Validate query parameters only
 * @param validations Array of query validation rules
 * @returns Middleware function
 */
export const validateQuery = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: (error as any).value,
      }));
      return next(new ValidationError('Query parameter validation failed', errorMessages));
    }
    next();
  };
};

/**
 * Validate path parameters only
 * @param validations Array of param validation rules
 * @returns Middleware function
 */
export const validateParams = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: (error as any).value,
      }));
      return next(new ValidationError('Path parameter validation failed', errorMessages));
    }
    next();
  };
};

/**
 * Validate request body only
 * @param validations Array of body validation rules
 * @returns Middleware function
 */
export const validateBody = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: (error as any).value,
      }));
      return next(new ValidationError('Request body validation failed', errorMessages));
    }
    next();
  };
};

/**
 * Sanitize request data (remove sensitive fields, trim strings, etc.)
 * @returns Middleware function
 */
export const sanitizeRequest = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Remove sensitive fields from body
    if (req.body) {
      delete req.body.password;
      delete req.body.confirmPassword;
      delete req.body.token;
      delete req.body.refreshToken;
    }

    // Trim string fields
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = (req.query[key] as string).trim();
        }
      });
    }

    next();
  };
};

/**
 * Rate limiting based on validation failures
 * @param maxFailures Maximum validation failures allowed
 * @param windowMs Time window in milliseconds
 * @returns Middleware function
 */
export const validationRateLimit = (maxFailures: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const failures = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const userFailures = failures.get(ip);

    if (userFailures && now < userFailures.resetTime) {
      if (userFailures.count >= maxFailures) {
        return res.status(429).json({
          success: false,
          error: 'Too many validation failures. Please try again later.',
        });
      }
    } else {
      failures.set(ip, { count: 0, resetTime: now + windowMs });
    }

    next();
  };
};

// Export the common handler for backward compatibility
export { handleValidationErrors } from '../validators/common.validator';
