import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError, ErrorFactory } from '../utils/errors';
import { formatValidationErrorResponse, generateRequestId } from '../utils/errorFormatter';

// Extend Request interface locally to avoid type issues
interface ExtendedRequest extends Request {
  requestId?: string;
}

export const validationErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    const errorResponse = formatValidationErrorResponse(errors.array(), req, requestId);
    res.status(400).json(errorResponse);
    return;
  }
  next();
};

export const enhancedValidationErrorHandler = (
  fieldMappings: Record<string, string> = {}
) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    const mappedErrors = errors.array().map(err => ({
      field: fieldMappings[(err as any).path || (err as any).param || ''] || (err as any).path || (err as any).param || 'unknown',
      message: err.msg || 'Invalid value',
      value: (err as any).value,
      location: (err as any).location || 'body',
    }));
    
    const errorResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        details: {
          errors: mappedErrors,
          fieldMappings,
        },
        requestId,
      },
    };
    
    res.status(400).json(errorResponse);
    return;
  }
  next();
};

export const routeValidationErrorHandler = (
  customErrorMessage?: string
) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    const errorResponse = {
      success: false,
      error: {
        message: customErrorMessage || 'Route validation failed',
        code: 'ROUTE_VALIDATION_ERROR',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        details: {
          errors: errors.array().map(err => ({
            field: (err as any).path || (err as any).param || 'unknown',
            message: err.msg || 'Invalid value',
            value: (err as any).value,
            location: (err as any).location || 'body',
          })),
          route: req.route?.path || 'unknown',
          method: req.method,
        },
        requestId,
      },
    };
    
    res.status(400).json(errorResponse);
    return;
  }
  next();
};

export const mappedValidationErrorHandler = (
  fieldMappings: Record<string, string> = {},
  customErrorMessage?: string
) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    const mappedErrors = errors.array().map(err => ({
      field: fieldMappings[(err as any).path || (err as any).param || ''] || (err as any).path || (err as any).param || 'unknown',
      message: err.msg || 'Invalid value',
      value: (err as any).value,
      location: (err as any).location || 'body',
    }));
    
    const errorResponse = {
      success: false,
      error: {
        message: customErrorMessage || 'Validation failed',
        code: 'MAPPED_VALIDATION_ERROR',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        details: {
          errors: mappedErrors,
          fieldMappings,
        },
        requestId,
      },
    };
    
    res.status(400).json(errorResponse);
    return;
  }
  next();
};

export const customValidationErrorHandler = (
  customErrorFormatter: (errors: any[], req: Request, requestId: string) => any
) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    const errorResponse = customErrorFormatter(errors.array(), req, requestId);
    res.status(400).json(errorResponse);
    return;
  }
  next();
};

export const groupedValidationErrorHandler = (
  groupBy: 'field' | 'location' | 'type' = 'field'
) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    
    const groupedErrors: Record<string, any[]> = {};
    errors.array().forEach(err => {
      const key = groupBy === 'field' ? ((err as any).path || (err as any).param || 'unknown') :
                  groupBy === 'location' ? ((err as any).location || 'body') :
                  err.msg || 'unknown';
      
      if (!groupedErrors[key]) {
        groupedErrors[key] = [];
      }
      
      groupedErrors[key].push({
        field: (err as any).path || (err as any).param || 'unknown',
        message: err.msg || 'Invalid value',
        value: (err as any).value,
        location: (err as any).location || 'body',
      });
    });
    
    const errorResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'GROUPED_VALIDATION_ERROR',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        details: {
          groupedErrors,
          groupBy,
          totalErrors: errors.array().length,
        },
        requestId,
      },
    };
    
    res.status(400).json(errorResponse);
    return;
  }
  next();
};

export const prioritizedValidationErrorHandler = (
  priorityFields: string[] = []
) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    
    const errorArray = errors.array();
    const prioritizedErrors: any[] = [];
    const otherErrors: any[] = [];
    
    errorArray.forEach(err => {
      const field = (err as any).path || (err as any).param || 'unknown';
      if (priorityFields.includes(field)) {
        prioritizedErrors.push({
          field,
          message: err.msg || 'Invalid value',
          value: (err as any).value,
          location: (err as any).location || 'body',
          priority: 'high',
        });
      } else {
        otherErrors.push({
          field,
          message: err.msg || 'Invalid value',
          value: (err as any).value,
          location: (err as any).location || 'body',
          priority: 'normal',
        });
      }
    });
    
    const errorResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'PRIORITIZED_VALIDATION_ERROR',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.url,
        details: {
          prioritizedErrors,
          otherErrors,
          priorityFields,
          totalErrors: errorArray.length,
        },
        requestId,
      },
    };
    
    res.status(400).json(errorResponse);
    return;
  }
  next();
};

export const filteredValidationErrorHandler = (
  filterFunction: (error: any) => boolean
) => (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const requestId = (req as ExtendedRequest).requestId || generateRequestId();
    
    const filteredErrors = errors.array().filter(filterFunction).map(err => ({
      field: (err as any).path || (err as any).param || 'unknown',
      message: err.msg || 'Invalid value',
      value: (err as any).value,
      location: (err as any).location || 'body',
    }));
    
    if (filteredErrors.length > 0) {
      const errorResponse = {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'FILTERED_VALIDATION_ERROR',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.originalUrl || req.url,
          details: {
            errors: filteredErrors,
            totalErrors: errors.array().length,
            filteredErrors: filteredErrors.length,
          },
          requestId,
        },
      };
      
      res.status(400).json(errorResponse);
      return;
    }
  }
  next();
};
