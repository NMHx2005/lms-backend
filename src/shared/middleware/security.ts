import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { getSecurityConfig } from '../config/security';

// Get security configuration based on environment
const securityConfig = getSecurityConfig();

// CORS middleware
export const corsMiddleware = cors(securityConfig.cors);

// Helmet middleware
export const helmetMiddleware = helmet(securityConfig.helmet);

// MongoDB sanitization middleware
export const mongoSanitizeMiddleware = mongoSanitize(securityConfig.mongoSanitize);

// HPP middleware
export const hppMiddleware = hpp(securityConfig.hpp);

// Trust proxy middleware
export const trustProxyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (securityConfig.security.trustProxy) {
    // Use res.set instead of req.set for headers
    res.set('X-Forwarded-Proto', 'https');
  }
  next();
};

// Request size limit middleware
export const requestSizeLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = parseInt(securityConfig.security.requestSizeLimit.replace('mb', '')) * 1024 * 1024;
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: {
        message: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        statusCode: 413,
        timestamp: new Date().toISOString(),
        maxSize: securityConfig.security.requestSizeLimit,
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
  next();
};

// Request timeout middleware
export const requestTimeoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timeout = securityConfig.security.api.timeout;
  
  req.setTimeout(timeout, () => {
    res.status(408).json({
      success: false,
      error: {
        message: 'Request timeout',
        code: 'REQUEST_TIMEOUT',
        statusCode: 408,
        timestamp: new Date().toISOString(),
        timeout: `${timeout}ms`,
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  });
  
  next();
};

// Security headers middleware
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });
  
  // Add environment-specific headers
  if (process.env.NODE_ENV === 'production') {
    res.set({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",
    });
  }
  
  next();
};

// Request validation middleware
export const requestValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Validate Content-Type for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.headers['content-type']) {
    const contentType = req.headers['content-type'].toLowerCase();
    
    if (contentType.includes('application/json') && !req.is('application/json')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid Content-Type. Expected application/json',
          code: 'INVALID_CONTENT_TYPE',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          expectedType: 'application/json',
          receivedType: contentType,
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  }
  
  // Validate Accept header
  if (req.headers.accept && !req.headers.accept.includes('application/json')) {
    return res.status(406).json({
      success: false,
      error: {
        message: 'Not Acceptable. Only application/json is supported',
        code: 'NOT_ACCEPTABLE',
        statusCode: 406,
        timestamp: new Date().toISOString(),
        supportedTypes: ['application/json'],
        receivedType: req.headers.accept,
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
  
  next();
};

// Input sanitization middleware
export const inputSanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    sanitizeObject(req.params);
  }
  
  next();
};

// Sanitize object recursively
function sanitizeObject(obj: any): void {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        obj[key] = value
          .replace(/[<>]/g, '') // Remove < and >
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/data:/gi, '') // Remove data: protocol
          .replace(/vbscript:/gi, '') // Remove vbscript: protocol
          .trim();
      } else if (typeof value === 'object') {
        sanitizeObject(value);
      }
    }
  }
}

// Method not allowed middleware
export const methodNotAllowedMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: {
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
        statusCode: 405,
        timestamp: new Date().toISOString(),
        method: req.method,
        allowedMethods,
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
  
  next();
};

// Request logging middleware
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (securityConfig.security.logging.enableRequestLogging) {
    const startTime = Date.now();
    
    // Log request start
    console.log(`[${new Date().toISOString()}] [${req.headers['x-request-id'] || 'unknown'}] ${req.method} ${req.originalUrl} - Started`);
    
    // Log request completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
      
      console.log(`[${new Date().toISOString()}] [${req.headers['x-request-id'] || 'unknown'}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${logLevel}`);
    });
  }
  
  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (securityConfig.security.logging.enableErrorLogging) {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 400) {
        console.error(`[${new Date().toISOString()}] [${req.headers['x-request-id'] || 'unknown'}] ERROR: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${data}`);
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
};

// Audit logging middleware
export const auditLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (securityConfig.security.logging.enableAuditLogging) {
    const auditData = {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown',
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      userEmail: req.user?.email || 'anonymous',
      userRoles: req.user?.roles || [],
      requestBody: req.method !== 'GET' ? req.body : undefined,
      queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
    };
    
    // Log sensitive operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      console.log(`[AUDIT] ${JSON.stringify(auditData)}`);
    }
  }
  
  next();
};

// Health check middleware
export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/healthz') {
    return res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        memory: process.memoryUsage(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
  
  next();
};

// Apply all security middleware
export const applySecurityMiddleware = (app: any) => {
  // Trust proxy (must be first)
  if (securityConfig.security.trustProxy) {
    app.set('trust proxy', 1);
  }
  
  // Basic security middleware
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(mongoSanitizeMiddleware);
  app.use(hppMiddleware);
  app.use(trustProxyMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(requestValidationMiddleware);
  app.use(inputSanitizationMiddleware);
  app.use(methodNotAllowedMiddleware);
  
  // Logging middleware
  app.use(requestLoggingMiddleware);
  app.use(errorLoggingMiddleware);
  app.use(auditLoggingMiddleware);
  
  // Health check middleware
  app.use(healthCheckMiddleware);
  
  // Request size and timeout middleware
  app.use(requestSizeLimitMiddleware);
  app.use(requestTimeoutMiddleware);
  
  console.log('✅ Security middleware applied successfully');
};

export default applySecurityMiddleware;
