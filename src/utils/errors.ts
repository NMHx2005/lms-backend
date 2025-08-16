// Custom error classes for the LMS system
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

// Error response formatter
export const formatErrorResponse = (error: AppError | Error) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
        type: error.constructor.name,
      },
    };
  }

  return {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      statusCode: 500,
      type: 'InternalError',
    },
  };
};

// Async error wrapper
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return (...args: T) => {
    return Promise.resolve(fn(...args)).catch(error => {
      throw error;
    });
  };
};
