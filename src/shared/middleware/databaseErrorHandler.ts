import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ERROR_CODES } from '../utils/errors';
import { formatDatabaseErrorResponse, generateRequestId } from '../utils/errorFormatter';

// Extend Request interface locally to avoid type issues
interface ExtendedRequest extends Request {
  requestId?: string;
}

// Database error handler middleware
export const databaseErrorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  // Handle MongoDB specific errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(500).json(errorResponse);
    return;
  }
  
  // Handle Mongoose specific errors
  if (error.name === 'ValidationError') {
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(500).json(errorResponse);
    return;
  }
  
  // Handle Cast errors (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(500).json(errorResponse);
    return;
  }
  
  // Pass error to next middleware if not a database error
  next(error);
};

// Enhanced database error handler with granular error mapping
export const enhancedDatabaseErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  // MongoDB error code mapping
  const mongoErrorMap: Record<number, { code: string; statusCode: number; message: string }> = {
    11000: { code: ERROR_CODES.DUPLICATE_KEY, statusCode: 409, message: 'Duplicate key error' },
    121: { code: ERROR_CODES.CONSTRAINT_VIOLATION, statusCode: 400, message: 'Document validation failed' },
    13: { code: ERROR_CODES.AUTHORIZATION_ERROR, statusCode: 403, message: 'Unauthorized operation' },
    18: { code: ERROR_CODES.AUTHENTICATION_ERROR, statusCode: 401, message: 'Authentication failed' },
    50: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    51: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    100: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    101: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    102: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    103: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    104: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    105: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    106: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    107: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    108: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    109: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    110: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    111: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    112: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    113: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    114: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    115: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    116: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    117: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    118: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    119: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    120: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    122: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    123: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    124: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    125: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    126: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    127: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    128: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    129: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    130: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    131: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    132: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    133: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    134: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    135: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    136: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    137: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    138: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    139: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    140: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    141: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    142: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    143: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    144: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    145: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    146: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    147: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    148: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    149: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    150: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    151: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    152: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    153: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    154: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    155: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    156: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    157: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    158: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    159: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    160: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    161: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    162: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    163: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    164: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    165: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    166: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    167: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    168: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    169: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    170: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    171: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    172: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    173: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    174: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    175: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    176: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    177: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    178: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    179: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    180: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    181: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    182: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    183: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    184: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    185: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    186: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    187: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    188: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    189: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    190: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    191: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    192: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    193: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    194: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    195: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    196: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    197: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    198: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    199: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
    200: { code: ERROR_CODES.DATABASE_ERROR, statusCode: 500, message: 'Database operation failed' },
  };
  
  // Handle MongoDB specific errors with detailed mapping
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    const errorInfo = mongoErrorMap[error.code] || {
      code: ERROR_CODES.DATABASE_ERROR,
      statusCode: 500,
      message: 'Database operation failed',
    };
    
    const appError = ErrorFactory.create(
      errorInfo.message,
      errorInfo.statusCode,
      errorInfo.code,
      true,
      {
        mongoErrorCode: error.code,
        mongoErrorName: error.name,
        originalError: error.message,
      }
    );
    
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(errorInfo.statusCode).json(errorResponse);
    return;
  }
  
  // Handle Mongoose specific errors
  if (error.name === 'ValidationError') {
    const appError = ErrorFactory.validation(
      'Document validation failed',
      Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value,
        kind: err.kind,
      }))
    );
    
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(400).json(errorResponse);
    return;
  }
  
  // Handle Cast errors (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    let appError;
    
    if (error.kind === 'ObjectId') {
      appError = ErrorFactory.create(
        'Invalid ObjectId format',
        400,
        ERROR_CODES.INVALID_MONGO_ID,
        true,
        {
          field: error.path,
          value: error.value,
          kind: error.kind,
        }
      );
    } else {
      appError = ErrorFactory.create(
        'Invalid data type',
        400,
        ERROR_CODES.VALIDATION_ERROR,
        true,
        {
          field: error.path,
          value: error.value,
          kind: error.kind,
        }
      );
    }
    
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(400).json(errorResponse);
    return;
  }
  
  // Pass error to next middleware if not a database error
  next(error);
};

// Database connection error handler
export const databaseConnectionErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  if (error.name === 'MongoNetworkError' || error.message?.includes('ECONNREFUSED')) {
    const appError = ErrorFactory.create(
      'Database connection failed',
      503,
      ERROR_CODES.CONNECTION_FAILED,
      false,
      {
        error: error.message,
        code: error.code,
        host: error.host,
        port: error.port,
      }
    );
    
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(503).json(errorResponse);
    return;
  }
  
  next(error);
};

// Database transaction error handler
export const databaseTransactionErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  if (error.name === 'TransactionError' || error.message?.includes('transaction')) {
    const appError = ErrorFactory.create(
      'Database transaction failed',
      500,
      ERROR_CODES.TRANSACTION_FAILED,
      false,
      {
        error: error.message,
        operation: error.operation,
        sessionId: error.sessionId,
      }
    );
    
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(500).json(errorResponse);
    return;
  }
  
  next(error);
};

// Database index error handler
export const databaseIndexErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req as ExtendedRequest).requestId || generateRequestId();
  
  if (error.name === 'MongoError' && error.code === 85) {
    const appError = ErrorFactory.create(
      'Database index error',
      500,
      ERROR_CODES.DATABASE_ERROR,
      false,
      {
        error: error.message,
        code: error.code,
        indexName: error.indexName,
      }
    );
    
    const errorResponse = formatDatabaseErrorResponse(error, req, requestId);
    res.status(500).json(errorResponse);
    return;
  }
  
  next(error);
};
