import { Request, Response, NextFunction } from 'express';
import { AppError, ERROR_CODES } from '../utils/errors';
import {
  formatErrorResponse,
  formatValidationErrorResponse,
  formatDatabaseErrorResponse,
  formatJWTErrorResponse,
  formatRateLimitErrorResponse,
  formatMaintenanceErrorResponse,
  generateRequestId,
  addRequestIdToHeaders,
  addRetryAfterHeader,
  addCorsHeaders,
} from '../utils/errorFormatter';

// Extend Request interface locally to avoid type issues
interface ExtendedRequest extends Request {
  requestId?: string;
}

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  (req as ExtendedRequest).requestId = requestId;
  addRequestIdToHeaders(res, requestId);
  next();
};

// Global error handler middleware
export const globalErrorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  // Add CORS headers for error responses
  addCorsHeaders(res);
  
  // Handle different types of errors
  if (error instanceof AppError) {
    // Handle custom application errors
    const errorResponse = formatErrorResponse(error, req, requestId);
    res.status(error.statusCode).json(errorResponse);
    return;
  }
  
  // Handle specific error types by name
  if (error.name === 'RateLimitError' || (error as any).statusCode === 429) {
    const retryAfter = (error as any).retryAfter || 60;
    addRetryAfterHeader(res, retryAfter);
    const errorResponse = formatRateLimitErrorResponse(req, requestId, retryAfter);
    res.status(429).json(errorResponse);
    return;
  }
  
  if (error.name === 'MaintenanceError' || (error as any).statusCode === 503) {
    const errorResponse = formatMaintenanceErrorResponse(req, requestId);
    res.status(503).json(errorResponse);
    return;
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
    const errorResponse = formatJWTErrorResponse(error, req, requestId);
    res.status(401).json(errorResponse);
    return;
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    const errorResponse = formatValidationErrorResponse([error], req, requestId);
    res.status(400).json(errorResponse);
    return;
  }
  
  // Handle database errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError' || error.name === 'CastError') {
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(500).json(errorResponse);
    return;
  }
  
  // Handle generic errors
  const errorResponse = formatErrorResponse(error, req, requestId);
  res.status(500).json(errorResponse);
};

// Async error wrapper for route handlers
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch(error => {
      // Pass error to global error handler
      const [req, res, next] = args as unknown as [Request, Response, NextFunction];
      if (next) {
        next(error);
      } else {
        throw error;
      }
      // Return a resolved promise to satisfy the return type
      return Promise.resolve() as Promise<R>;
    });
  };
};

// 404 handler middleware
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  addCorsHeaders(res);
  addRequestIdToHeaders(res, requestId);
  
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: ERROR_CODES.NOT_FOUND_ERROR,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.url,
      details: {
        method: req.method,
        availableRoutes: ['/api/auth', '/api/admin', '/api/client'],
      },
      requestId,
    },
  });
};

// Error logging middleware
export const errorLoggingMiddleware = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as ExtendedRequest).requestId || 'unknown';
  
  // Log error details
  console.error(`[${new Date().toISOString()}] [${requestId}] Error:`, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    ...(error instanceof AppError && {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      isOperational: error.isOperational,
      details: error.details,
    }),
  });
  
  // Pass error to next middleware
  next(error);
};

// Development error handler (detailed error information)
export const developmentErrorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV !== 'development') {
    return next(error);
  }
  
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  // Enhanced error response for development
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        isOperational: error.isOperational,
        details: error.details,
      }),
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.url,
      requestId,
      request: {
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
      },
    },
  };
  
  addCorsHeaders(res);
  addRequestIdToHeaders(res, requestId);
  
  if (error instanceof AppError) {
    res.status(error.statusCode).json(errorResponse);
  } else {
    res.status(500).json(errorResponse);
  }
};

// Production error handler (sanitized error information)
export const productionErrorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development') {
    return next(error);
  }
  
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  // Sanitized error response for production
  const errorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
      code: ERROR_CODES.INTERNAL_ERROR,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.url,
      requestId,
    },
  };
  
  addCorsHeaders(res);
  addRequestIdToHeaders(res, requestId);
  res.status(500).json(errorResponse);
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any, signal: string): void => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connections
    // mongoose.connection.close();
    
    // Close other connections (Redis, etc.)
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Unhandled rejection handler
export const unhandledRejectionHandler = (reason: any, promise: Promise<any>): void => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Log the error and continue running
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Uncaught exception handler
export const uncaughtExceptionHandler = (error: Error): void => {
  console.error('Uncaught Exception:', error);
  
  // Log the error and exit the process
  // This is critical and should always exit
  process.exit(1);
};
