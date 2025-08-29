import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import helmet from 'helmet';
import { Request } from 'express';

// Rate limiting configuration
export const rateLimitConfig = {
  // General rate limit for all routes
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: '15 minutes',
      },
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Stricter rate limit for auth routes
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
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
          message: 'Too many authentication attempts, please try again later',
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Rate limit for file uploads
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 uploads per hour
    message: {
      success: false,
      error: {
        message: 'Too many file uploads, please try again later',
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
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
          message: 'Too many file uploads, please try again later',
          code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '1 hour',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Rate limit for API endpoints
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    message: {
      success: false,
      error: {
        message: 'Too many API requests, please try again later',
        code: 'API_RATE_LIMIT_EXCEEDED',
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
          message: 'Too many API requests, please try again later',
          code: 'API_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),

  // Rate limit for admin routes
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: {
      success: false,
      error: {
        message: 'Too many admin requests, please try again later',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
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
          message: 'Too many admin requests, please try again later',
          code: 'ADMIN_RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: '15 minutes',
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    },
  }),
};

// Speed limiting configuration
export const speedLimitConfig = {
  // General speed limit
  general: slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 minutes without delay
    delayMs: () => 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
  }),

  // Speed limit for file uploads
  upload: slowDown({
    windowMs: 60 * 60 * 1000, // 1 hour
    delayAfter: 5, // Allow 5 uploads per hour without delay
    delayMs: () => 1000, // Add 1 second delay per upload after delayAfter
    maxDelayMs: 30000, // Maximum delay of 30 seconds
  }),
};

// CORS configuration
export const corsConfig = {
  // Development CORS config
  development: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // Production CORS config
  production: {
    origin: [
      // Add other production domains here
      'https://lms-frontend-mocha-eight.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // Staging CORS config
  staging: {
    origin: [
      'https://staging.superadmin.musashino-rag.io.vn',
      'https://staging-api.superadmin.musashino-rag.io.vn',
      // Add other staging domains here
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
};

// Helmet configuration for different environments
export const helmetConfig = {
  // Development helmet config (relaxed)
  development: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" as const },
  },

  // Production helmet config (strict)
  production: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: { policy: "same-origin" as const },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // Staging helmet config (moderate)
  staging: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" as const },
  },
};

// MongoDB sanitization configuration
export const mongoSanitizeConfig = {
  replaceWith: '_',
  onSanitize: ({ req, key }: { req: Request; key: string }) => {
    console.warn(`MongoDB injection attempt detected: ${key} in ${req.originalUrl}`);
  },
  dryRun: false,
};

// HPP (HTTP Parameter Pollution) configuration
export const hppConfig = {
  whitelist: [
    'filter',
    'sort',
    'page',
    'limit',
    'fields',
    'populate',
    'select',
    'lean',
  ],
};

// Security middleware configuration
export const securityConfig = {
  // Trust proxy configuration
  trustProxy: process.env.NODE_ENV === 'production',

  // Request size limits
  requestSizeLimit: '10mb',

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Password configuration
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // File upload security
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    scanForViruses: process.env.NODE_ENV === 'production',
  },

  // API security
  api: {
    enableRateLimiting: true,
    enableSpeedLimiting: true,
    enableRequestLogging: true,
    enableErrorLogging: true,
    enableAuditLogging: true,
    maxRequestSize: '10mb',
    timeout: 30000, // 30 seconds
  },

  // Database security
  database: {
    enableQueryLogging: process.env.NODE_ENV === 'development',
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
    maxConnections: 10,
    connectionTimeout: 30000, // 30 seconds
  },

  // Logging security
  logging: {
    enableRequestLogging: true,
    enableErrorLogging: true,
    enableAuditLogging: true,
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || 'logs/app.log',
    maxLogSize: 10 * 1024 * 1024, // 10MB
    maxLogFiles: 5,
  },
};

// Environment-specific configuration
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  return {
    cors: corsConfig[env as keyof typeof corsConfig] || corsConfig.development,
    helmet: helmetConfig[env as keyof typeof helmetConfig] || helmetConfig.development,
    rateLimit: rateLimitConfig,
    speedLimit: speedLimitConfig,
    mongoSanitize: mongoSanitizeConfig,
    hpp: hppConfig,
    security: securityConfig,
  };
};

export default getSecurityConfig;
