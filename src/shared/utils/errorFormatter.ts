import { Request, Response } from 'express';
import { AppError, ErrorResponse, ERROR_CODES, ERROR_MESSAGES_EN, ERROR_MESSAGES_VI } from './errors';

// Generate unique request ID
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get user language preference
export const getUserLanguage = (req: Request): 'en' | 'vi' => {
  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage && acceptLanguage.includes('vi')) {
    return 'vi';
  }
  
  // Check custom header
  const customLang = req.headers['x-language'] as string;
  if (customLang && ['en', 'vi'].includes(customLang)) {
    return customLang as 'en' | 'vi';
  }
  
  // Default to English
  return 'en';
};

// Get localized error message
export const getLocalizedErrorMessage = (errorCode: string, language: 'en' | 'vi'): string => {
  const messages = language === 'vi' ? ERROR_MESSAGES_VI : ERROR_MESSAGES_EN;
  return messages[errorCode as keyof typeof messages] || messages[ERROR_CODES.UNKNOWN_ERROR];
};

// Format error response
export const formatErrorResponse = (
  error: AppError | Error,
  req: Request,
  requestId?: string
): ErrorResponse => {
  const language = getUserLanguage(req);
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  
  if (error instanceof AppError) {
    const localizedMessage = getLocalizedErrorMessage(error.errorCode, language);
    
    return {
      success: false,
      error: {
        message: localizedMessage,
        code: error.errorCode,
        statusCode: error.statusCode,
        timestamp,
        path,
        details: error.details,
        requestId,
      },
    };
  }
  
  // Handle generic errors
  return {
    success: false,
    error: {
      message: getLocalizedErrorMessage(ERROR_CODES.UNKNOWN_ERROR, language),
      code: ERROR_CODES.UNKNOWN_ERROR,
      statusCode: 500,
      timestamp,
      path,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId,
    },
  };
};

// Format validation error response
export const formatValidationErrorResponse = (
  errors: any[],
  req: Request,
  requestId?: string
): ErrorResponse => {
  const language = getUserLanguage(req);
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  
  const formattedErrors = errors.map(err => ({
    field: err.path || err.param || 'unknown',
    message: err.msg || 'Invalid value',
    value: err.value,
    location: err.location || 'body',
  }));
  
  return {
    success: false,
    error: {
      message: getLocalizedErrorMessage(ERROR_CODES.VALIDATION_ERROR, language),
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: 400,
      timestamp,
      path,
      details: {
        validationErrors: formattedErrors,
        totalErrors: errors.length,
      },
      requestId,
    },
  };
};

// Format database error response
export const formatDatabaseErrorResponse = (
  error: any,
  req: Request,
  requestId?: string
): ErrorResponse => {
  const language = getUserLanguage(req);
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  
  let errorCode: string = ERROR_CODES.DATABASE_ERROR;
  let message = getLocalizedErrorMessage(ERROR_CODES.DATABASE_ERROR, language);
  let details: any = { originalError: error.message };
  
  // Handle MongoDB specific errors
  if (error.code === 11000) {
    errorCode = ERROR_CODES.DUPLICATE_KEY;
    message = getLocalizedErrorMessage(ERROR_CODES.DUPLICATE_KEY, language);
    details.duplicateField = Object.keys(error.keyPattern || {})[0];
  } else if (error.code === 121) {
    errorCode = ERROR_CODES.CONSTRAINT_VIOLATION;
    message = getLocalizedErrorMessage(ERROR_CODES.CONSTRAINT_VIOLATION, language);
    details.constraintViolation = error.errmsg;
  }
  
  // Handle Mongoose specific errors
  if (error.name === 'ValidationError') {
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = getLocalizedErrorMessage(ERROR_CODES.VALIDATION_ERROR, language);
    details.validationErrors = Object.values(error.errors || {}).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
  } else if (error.name === 'CastError') {
    if (error.kind === 'ObjectId') {
      errorCode = ERROR_CODES.INVALID_MONGO_ID;
      message = getLocalizedErrorMessage(ERROR_CODES.INVALID_MONGO_ID, language);
    }
    details.castError = {
      field: error.path,
      value: error.value,
      kind: error.kind,
    };
  }
  
  return {
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode: 500,
      timestamp,
      path,
      details,
      requestId,
    },
  };
};

// Format JWT error response
export const formatJWTErrorResponse = (
  error: any,
  req: Request,
  requestId?: string
): ErrorResponse => {
  const language = getUserLanguage(req);
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  
  let errorCode: string = ERROR_CODES.JWT_ERROR;
  let message = getLocalizedErrorMessage(ERROR_CODES.JWT_ERROR, language);
  
  if (error.name === 'JsonWebTokenError') {
    errorCode = ERROR_CODES.JWT_MALFORMED;
    message = getLocalizedErrorMessage(ERROR_CODES.JWT_MALFORMED, language);
  } else if (error.name === 'TokenExpiredError') {
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
    message = getLocalizedErrorMessage(ERROR_CODES.TOKEN_EXPIRED, language);
  }
  
  return {
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode: 401,
      timestamp,
      path,
      details: {
        jwtError: error.name,
        expiredAt: error.expiredAt,
      },
      requestId,
    },
  };
};

// Format rate limit error response
export const formatRateLimitErrorResponse = (
  req: Request,
  requestId?: string,
  retryAfter?: number
): ErrorResponse => {
  const language = getUserLanguage(req);
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  
  return {
    success: false,
    error: {
      message: getLocalizedErrorMessage(ERROR_CODES.RATE_LIMIT_ERROR, language),
      code: ERROR_CODES.RATE_LIMIT_ERROR,
      statusCode: 429,
      timestamp,
      path,
      details: {
        retryAfter,
        limit: (req as any).rateLimit?.limit,
        current: (req as any).rateLimit?.current,
        remaining: (req as any).rateLimit?.remaining,
      },
      requestId,
    },
  };
};

// Format maintenance error response
export const formatMaintenanceErrorResponse = (
  req: Request,
  requestId?: string,
  estimatedTime?: string
): ErrorResponse => {
  const language = getUserLanguage(req);
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  
  return {
    success: false,
    error: {
      message: getLocalizedErrorMessage(ERROR_CODES.MAINTENANCE_ERROR, language),
      code: ERROR_CODES.MAINTENANCE_ERROR,
      statusCode: 503,
      timestamp,
      path,
      details: {
        maintenance: true,
        estimatedTime,
        contact: process.env.SUPPORT_EMAIL || 'support@lms.com',
      },
      requestId,
    },
  };
};

// Utility functions for headers
export const addRequestIdToHeaders = (res: Response, requestId: string): void => {
  res.setHeader('X-Request-ID', requestId);
};

export const addRetryAfterHeader = (res: Response, retryAfter: number): void => {
  res.setHeader('Retry-After', retryAfter);
};

export const addCorsHeaders = (res: Response): void => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
};
