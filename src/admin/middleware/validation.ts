import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../shared/utils/errors';

// Generic validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        const errorMessage = error.details.map((detail: any) => detail.message).join(', ');
        throw new ValidationError(errorMessage);
      }
      
      req.body = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Validate ObjectId format
export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new ValidationError(`Invalid ${paramName} format`));
    }
    
    next();
  };
};

// Validate pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;
  
  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return next(new ValidationError('Page must be a positive integer'));
  }
  
  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return next(new ValidationError('Limit must be between 1 and 100'));
  }
  
  next();
};

// Validate search query
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { search } = req.query;
  
  if (search && typeof search !== 'string') {
    return next(new ValidationError('Search query must be a string'));
  }
  
  if (search && search.length < 2) {
    return next(new ValidationError('Search query must be at least 2 characters'));
  }
  
  next();
};

// Validate date range
export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;
  
  if (startDate) {
    const start = new Date(startDate as string);
    if (isNaN(start.getTime())) {
      return next(new ValidationError('Invalid start date format'));
    }
  }
  
  if (endDate) {
    const end = new Date(endDate as string);
    if (isNaN(end.getTime())) {
      return next(new ValidationError('Invalid end date format'));
    }
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (start >= end) {
      return next(new ValidationError('Start date must be before end date'));
    }
  }
  
  next();
};

// Validate file upload
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next(new ValidationError('File is required'));
    }
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
    
    if (req.file.size > maxSize) {
      return next(new ValidationError(`File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`));
    }
    
    next();
  };
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate phone number (Vietnamese format)
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+84|84|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
};

// Validate Vietnamese currency (VND)
export const validateCurrency = (amount: number): boolean => {
  return amount >= 0 && Number.isInteger(amount);
};

// Validate course level
export const validateCourseLevel = (level: string): boolean => {
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  return validLevels.includes(level);
};

// Validate course domain
export const validateCourseDomain = (domain: string): boolean => {
  const validDomains = [
    'IT', 'Economics', 'Law', 'Marketing', 'Design', 
    'Language', 'Science', 'Arts', 'Business', 'Other'
  ];
  return validDomains.includes(domain);
};

// Validate user roles
export const validateUserRoles = (roles: string[]): boolean => {
  const validRoles = ['student', 'teacher', 'admin'];
  return roles.every(role => validRoles.includes(role));
};

// Validate subscription plan
export const validateSubscriptionPlan = (plan: string): boolean => {
  const validPlans = ['free', 'pro', 'advanced'];
  return validPlans.includes(plan);
};
