export { validateRequest, handleValidationErrors } from './validation';

// Authentication and authorization middleware
export {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requirePermission,
  requireOwnership,
  requireCourseOwnership,
  requireEnrollment,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
} from './auth';

export { 
  hasPermission, 
  roleBasedRateLimit,
  auditLog,
  ROLE_PERMISSIONS,
  type Permission
} from './rbac';

// Error handling middleware
export * from './errorHandler';
export * from './validationErrorHandler';
export * from './databaseErrorHandler';

// File upload middleware
export * from './multer';

// Security middleware (excluding duplicate exports)
export {
  corsMiddleware,
  helmetMiddleware,
  mongoSanitizeMiddleware,
  hppMiddleware,
  trustProxyMiddleware,
  requestSizeLimitMiddleware,
  requestTimeoutMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
  inputSanitizationMiddleware,
  methodNotAllowedMiddleware,
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  auditLoggingMiddleware,
  healthCheckMiddleware,
  applySecurityMiddleware,
} from './security';
