// Base error class for all application errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', true, details);
  }
}

// Authorization errors
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', true, details);
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND_ERROR', true, details);
  }
}

// Conflict errors (duplicate, already exists)
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT_ERROR', true, details);
  }
}

// Rate limit errors
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, details);
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', false, details);
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', false, details);
  }
}

// File upload errors
export class FileUploadError extends AppError {
  constructor(message: string = 'File upload failed', details?: any) {
    super(message, 400, 'FILE_UPLOAD_ERROR', true, details);
  }
}

// Payment errors
export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed', details?: any) {
    super(message, 400, 'PAYMENT_ERROR', true, details);
  }
}

// Course enrollment errors
export class EnrollmentError extends AppError {
  constructor(message: string = 'Course enrollment failed', details?: any) {
    super(message, 400, 'ENROLLMENT_ERROR', true, details);
  }
}

// JWT token errors
export class JWTError extends AppError {
  constructor(message: string = 'JWT token error', details?: any) {
    super(message, 401, 'JWT_ERROR', true, details);
  }
}

// Business logic errors
export class BusinessLogicError extends AppError {
  constructor(message: string = 'Business rule violation', details?: any) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR', true, details);
  }
}

// Maintenance mode errors
export class MaintenanceError extends AppError {
  constructor(message: string = 'System under maintenance', details?: any) {
    super(message, 503, 'MAINTENANCE_ERROR', true, details);
  }
}

// Error factory for creating specific error types
export class ErrorFactory {
  static create(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational: boolean = true,
    details?: any
  ): AppError {
    return new AppError(message, statusCode, errorCode, isOperational, details);
  }

  static validation(message: string, details?: any): ValidationError {
    return new ValidationError(message, details);
  }

  static authentication(message: string, details?: any): AuthenticationError {
    return new AuthenticationError(message, details);
  }

  static authorization(message: string, details?: any): AuthorizationError {
    return new AuthorizationError(message, details);
  }

  static notFound(message: string, details?: any): NotFoundError {
    return new NotFoundError(message, details);
  }

  static conflict(message: string, details?: any): ConflictError {
    return new ConflictError(message, details);
  }

  static rateLimit(message: string, details?: any): RateLimitError {
    return new RateLimitError(message, details);
  }

  static database(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, details);
  }

  static externalService(message: string, details?: any): ExternalServiceError {
    return new ExternalServiceError(message, details);
  }

  static fileUpload(message: string, details?: any): FileUploadError {
    return new FileUploadError(message, details);
  }

  static payment(message: string, details?: any): PaymentError {
    return new PaymentError(message, details);
  }

  static enrollment(message: string, details?: any): EnrollmentError {
    return new EnrollmentError(message, details);
  }

  static jwt(message: string, details?: any): JWTError {
    return new JWTError(message, details);
  }

  static businessLogic(message: string, details?: any): BusinessLogicError {
    return new BusinessLogicError(message, details);
  }

  static maintenance(message: string, details?: any): MaintenanceError {
    return new MaintenanceError(message, details);
  }
}

// Error response interface
export interface ErrorResponse {
  success: false;
      error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
    path: string;
    details?: any;
    requestId?: string;
  };
}

// Error codes mapping
export const ERROR_CODES = {
  // Validation errors (1000-1999)
  VALIDATION_ERROR: '1000',
  INVALID_INPUT: '1001',
  MISSING_REQUIRED_FIELD: '1002',
  INVALID_FORMAT: '1003',
  FIELD_TOO_LONG: '1004',
  FIELD_TOO_SHORT: '1005',
  INVALID_EMAIL: '1006',
  INVALID_PASSWORD: '1007',
  INVALID_PHONE: '1008',
  INVALID_URL: '1009',
  INVALID_DATE: '1010',
  INVALID_ENUM_VALUE: '1011',
  INVALID_MONGO_ID: '1012',

  // Authentication errors (2000-2999)
  AUTHENTICATION_ERROR: '2000',
  INVALID_CREDENTIALS: '2001',
  TOKEN_EXPIRED: '2002',
  TOKEN_INVALID: '2003',
  TOKEN_MISSING: '2004',
  REFRESH_TOKEN_INVALID: '2005',
  ACCOUNT_LOCKED: '2006',
  ACCOUNT_DISABLED: '2007',
  TOO_MANY_LOGIN_ATTEMPTS: '2008',
  PASSWORD_RESET_EXPIRED: '2009',

  // Authorization errors (3000-3999)
  AUTHORIZATION_ERROR: '3000',
  INSUFFICIENT_PERMISSIONS: '3001',
  ROLE_REQUIRED: '3002',
  RESOURCE_ACCESS_DENIED: '3003',
  ADMIN_ACCESS_REQUIRED: '3004',
  TEACHER_ACCESS_REQUIRED: '3005',
  STUDENT_ACCESS_REQUIRED: '3006',

  // Not found errors (4000-4999)
  NOT_FOUND_ERROR: '4000',
  USER_NOT_FOUND: '4001',
  COURSE_NOT_FOUND: '4002',
  LESSON_NOT_FOUND: '4003',
  ENROLLMENT_NOT_FOUND: '4004',
  PAYMENT_NOT_FOUND: '4005',
  FILE_NOT_FOUND: '4006',

  // Conflict errors (5000-5999)
  CONFLICT_ERROR: '5000',
  USER_ALREADY_EXISTS: '5001',
  EMAIL_ALREADY_REGISTERED: '5002',
  COURSE_ALREADY_ENROLLED: '5003',
  DUPLICATE_ENTRY: '5004',
  RESOURCE_IN_USE: '5005',

  // Rate limit errors (6000-6999)
  RATE_LIMIT_ERROR: '6000',
  TOO_MANY_REQUESTS: '6001',
  API_RATE_LIMIT_EXCEEDED: '6002',
  LOGIN_RATE_LIMIT_EXCEEDED: '6003',

  // Database errors (7000-7999)
  DATABASE_ERROR: '7000',
  CONNECTION_FAILED: '7001',
  QUERY_FAILED: '7002',
  TRANSACTION_FAILED: '7003',
  CONSTRAINT_VIOLATION: '7004',
  DUPLICATE_KEY: '7005',

  // External service errors (8000-8999)
  EXTERNAL_SERVICE_ERROR: '8000',
  PAYMENT_GATEWAY_ERROR: '8001',
  EMAIL_SERVICE_ERROR: '8002',
  STORAGE_SERVICE_ERROR: '8003',
  THIRD_PARTY_API_ERROR: '8004',

  // File upload errors (9000-9999)
  FILE_UPLOAD_ERROR: '9000',
  FILE_TOO_LARGE: '9001',
  INVALID_FILE_TYPE: '9002',
  FILE_CORRUPTED: '9003',
  UPLOAD_FAILED: '9004',

  // Payment errors (10000-10999)
  PAYMENT_ERROR: '10000',
  PAYMENT_DECLINED: '10001',
  INSUFFICIENT_FUNDS: '10002',
  PAYMENT_METHOD_INVALID: '10003',
  REFUND_FAILED: '10004',

  // Enrollment errors (11000-11999)
  ENROLLMENT_ERROR: '11000',
  COURSE_FULL: '11001',
  PREREQUISITE_NOT_MET: '11002',
  ENROLLMENT_CLOSED: '11003',
  MAX_ENROLLMENTS_EXCEEDED: '11004',

  // JWT errors (12000-12999)
  JWT_ERROR: '12000',
  JWT_MALFORMED: '12001',
  JWT_SIGNATURE_INVALID: '12002',
  JWT_ISSUER_INVALID: '12003',
  JWT_AUDIENCE_INVALID: '12004',

  // Business logic errors (13000-13999)
  BUSINESS_LOGIC_ERROR: '13000',
  COURSE_NOT_PUBLISHED: '13001',
  LESSON_NOT_AVAILABLE: '13002',
  CERTIFICATE_NOT_ELIGIBLE: '13003',
  PROGRESS_INSUFFICIENT: '13004',

  // Maintenance errors (14000-14999)
  MAINTENANCE_ERROR: '14000',
  SYSTEM_MAINTENANCE: '14001',
  SCHEDULED_MAINTENANCE: '14002',
  EMERGENCY_MAINTENANCE: '14003',

  // Internal server errors (15000-15999)
  INTERNAL_ERROR: '15000',
  UNKNOWN_ERROR: '15001',
  CONFIGURATION_ERROR: '15002',
  MIDDLEWARE_ERROR: '15003',
} as const;

// Error messages mapping (Vietnamese)
export const ERROR_MESSAGES_VI = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ',
  [ERROR_CODES.INVALID_INPUT]: 'Dữ liệu đầu vào không hợp lệ',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Thiếu trường bắt buộc',
  [ERROR_CODES.INVALID_FORMAT]: 'Định dạng không hợp lệ',
  [ERROR_CODES.FIELD_TOO_LONG]: 'Trường quá dài',
  [ERROR_CODES.FIELD_TOO_SHORT]: 'Trường quá ngắn',
  [ERROR_CODES.INVALID_EMAIL]: 'Email không hợp lệ',
  [ERROR_CODES.INVALID_PASSWORD]: 'Mật khẩu không hợp lệ',
  [ERROR_CODES.INVALID_PHONE]: 'Số điện thoại không hợp lệ',
  [ERROR_CODES.INVALID_URL]: 'URL không hợp lệ',
  [ERROR_CODES.INVALID_DATE]: 'Ngày tháng không hợp lệ',
  [ERROR_CODES.INVALID_ENUM_VALUE]: 'Giá trị không hợp lệ',
  [ERROR_CODES.INVALID_MONGO_ID]: 'ID không hợp lệ',

  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Xác thực thất bại',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Thông tin đăng nhập không chính xác',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Token đã hết hạn',
  [ERROR_CODES.TOKEN_INVALID]: 'Token không hợp lệ',
  [ERROR_CODES.TOKEN_MISSING]: 'Thiếu token',
  [ERROR_CODES.REFRESH_TOKEN_INVALID]: 'Refresh token không hợp lệ',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Tài khoản đã bị khóa',
  [ERROR_CODES.ACCOUNT_DISABLED]: 'Tài khoản đã bị vô hiệu hóa',
  [ERROR_CODES.TOO_MANY_LOGIN_ATTEMPTS]: 'Quá nhiều lần đăng nhập thất bại',
  [ERROR_CODES.PASSWORD_RESET_EXPIRED]: 'Link đặt lại mật khẩu đã hết hạn',

  [ERROR_CODES.AUTHORIZATION_ERROR]: 'Truy cập bị từ chối',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Không đủ quyền truy cập',
  [ERROR_CODES.ROLE_REQUIRED]: 'Yêu cầu vai trò cụ thể',
  [ERROR_CODES.RESOURCE_ACCESS_DENIED]: 'Không thể truy cập tài nguyên',
  [ERROR_CODES.ADMIN_ACCESS_REQUIRED]: 'Yêu cầu quyền admin',
  [ERROR_CODES.TEACHER_ACCESS_REQUIRED]: 'Yêu cầu quyền giáo viên',
  [ERROR_CODES.STUDENT_ACCESS_REQUIRED]: 'Yêu cầu quyền học viên',

  [ERROR_CODES.NOT_FOUND_ERROR]: 'Không tìm thấy tài nguyên',
  [ERROR_CODES.USER_NOT_FOUND]: 'Không tìm thấy người dùng',
  [ERROR_CODES.COURSE_NOT_FOUND]: 'Không tìm thấy khóa học',
  [ERROR_CODES.LESSON_NOT_FOUND]: 'Không tìm thấy bài học',
  [ERROR_CODES.ENROLLMENT_NOT_FOUND]: 'Không tìm thấy đăng ký',
  [ERROR_CODES.PAYMENT_NOT_FOUND]: 'Không tìm thấy thanh toán',
  [ERROR_CODES.FILE_NOT_FOUND]: 'Không tìm thấy tệp tin',

  [ERROR_CODES.CONFLICT_ERROR]: 'Xung đột tài nguyên',
  [ERROR_CODES.USER_ALREADY_EXISTS]: 'Người dùng đã tồn tại',
  [ERROR_CODES.EMAIL_ALREADY_REGISTERED]: 'Email đã được đăng ký',
  [ERROR_CODES.COURSE_ALREADY_ENROLLED]: 'Đã đăng ký khóa học này',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'Dữ liệu trùng lặp',
  [ERROR_CODES.RESOURCE_IN_USE]: 'Tài nguyên đang được sử dụng',

  [ERROR_CODES.RATE_LIMIT_ERROR]: 'Vượt quá giới hạn yêu cầu',
  [ERROR_CODES.TOO_MANY_REQUESTS]: 'Quá nhiều yêu cầu',
  [ERROR_CODES.API_RATE_LIMIT_EXCEEDED]: 'Vượt quá giới hạn API',
  [ERROR_CODES.LOGIN_RATE_LIMIT_EXCEEDED]: 'Vượt quá giới hạn đăng nhập',

  [ERROR_CODES.DATABASE_ERROR]: 'Lỗi cơ sở dữ liệu',
  [ERROR_CODES.CONNECTION_FAILED]: 'Kết nối cơ sở dữ liệu thất bại',
  [ERROR_CODES.QUERY_FAILED]: 'Truy vấn cơ sở dữ liệu thất bại',
  [ERROR_CODES.TRANSACTION_FAILED]: 'Giao dịch cơ sở dữ liệu thất bại',
  [ERROR_CODES.CONSTRAINT_VIOLATION]: 'Vi phạm ràng buộc cơ sở dữ liệu',
  [ERROR_CODES.DUPLICATE_KEY]: 'Khóa trùng lặp',

  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'Lỗi dịch vụ bên ngoài',
  [ERROR_CODES.PAYMENT_GATEWAY_ERROR]: 'Lỗi cổng thanh toán',
  [ERROR_CODES.EMAIL_SERVICE_ERROR]: 'Lỗi dịch vụ email',
  [ERROR_CODES.STORAGE_SERVICE_ERROR]: 'Lỗi dịch vụ lưu trữ',
  [ERROR_CODES.THIRD_PARTY_API_ERROR]: 'Lỗi API bên thứ ba',

  [ERROR_CODES.FILE_UPLOAD_ERROR]: 'Lỗi tải tệp tin',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Tệp tin quá lớn',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Loại tệp tin không hợp lệ',
  [ERROR_CODES.FILE_CORRUPTED]: 'Tệp tin bị hỏng',
  [ERROR_CODES.UPLOAD_FAILED]: 'Tải tệp tin thất bại',

  [ERROR_CODES.PAYMENT_ERROR]: 'Lỗi thanh toán',
  [ERROR_CODES.PAYMENT_DECLINED]: 'Thanh toán bị từ chối',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Không đủ tiền',
  [ERROR_CODES.PAYMENT_METHOD_INVALID]: 'Phương thức thanh toán không hợp lệ',
  [ERROR_CODES.REFUND_FAILED]: 'Hoàn tiền thất bại',

  [ERROR_CODES.ENROLLMENT_ERROR]: 'Lỗi đăng ký khóa học',
  [ERROR_CODES.COURSE_FULL]: 'Khóa học đã đầy',
  [ERROR_CODES.PREREQUISITE_NOT_MET]: 'Chưa đáp ứng điều kiện tiên quyết',
  [ERROR_CODES.ENROLLMENT_CLOSED]: 'Đăng ký đã đóng',
  [ERROR_CODES.MAX_ENROLLMENTS_EXCEEDED]: 'Vượt quá số lượng đăng ký tối đa',

  [ERROR_CODES.JWT_ERROR]: 'Lỗi JWT token',
  [ERROR_CODES.JWT_MALFORMED]: 'JWT token bị lỗi định dạng',
  [ERROR_CODES.JWT_SIGNATURE_INVALID]: 'Chữ ký JWT không hợp lệ',
  [ERROR_CODES.JWT_ISSUER_INVALID]: 'Người phát hành JWT không hợp lệ',
  [ERROR_CODES.JWT_AUDIENCE_INVALID]: 'Đối tượng JWT không hợp lệ',

  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 'Lỗi logic nghiệp vụ',
  [ERROR_CODES.COURSE_NOT_PUBLISHED]: 'Khóa học chưa được xuất bản',
  [ERROR_CODES.LESSON_NOT_AVAILABLE]: 'Bài học chưa có sẵn',
  [ERROR_CODES.CERTIFICATE_NOT_ELIGIBLE]: 'Chưa đủ điều kiện nhận chứng chỉ',
  [ERROR_CODES.PROGRESS_INSUFFICIENT]: 'Tiến độ học tập chưa đủ',

  [ERROR_CODES.MAINTENANCE_ERROR]: 'Hệ thống đang bảo trì',
  [ERROR_CODES.SYSTEM_MAINTENANCE]: 'Hệ thống đang bảo trì',
  [ERROR_CODES.SCHEDULED_MAINTENANCE]: 'Bảo trì theo lịch trình',
  [ERROR_CODES.EMERGENCY_MAINTENANCE]: 'Bảo trì khẩn cấp',

  [ERROR_CODES.INTERNAL_ERROR]: 'Lỗi nội bộ hệ thống',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Lỗi không xác định',
  [ERROR_CODES.CONFIGURATION_ERROR]: 'Lỗi cấu hình',
  [ERROR_CODES.MIDDLEWARE_ERROR]: 'Lỗi middleware',
} as const;

// Error messages mapping (English)
export const ERROR_MESSAGES_EN = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input data',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid format',
  [ERROR_CODES.FIELD_TOO_LONG]: 'Field too long',
  [ERROR_CODES.FIELD_TOO_SHORT]: 'Field too short',
  [ERROR_CODES.INVALID_EMAIL]: 'Invalid email',
  [ERROR_CODES.INVALID_PASSWORD]: 'Invalid password',
  [ERROR_CODES.INVALID_PHONE]: 'Invalid phone number',
  [ERROR_CODES.INVALID_URL]: 'Invalid URL',
  [ERROR_CODES.INVALID_DATE]: 'Invalid date',
  [ERROR_CODES.INVALID_ENUM_VALUE]: 'Invalid enum value',
  [ERROR_CODES.INVALID_MONGO_ID]: 'Invalid MongoDB ID',

  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication failed',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid credentials',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Token expired',
  [ERROR_CODES.TOKEN_INVALID]: 'Invalid token',
  [ERROR_CODES.TOKEN_MISSING]: 'Missing token',
  [ERROR_CODES.REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Account locked',
  [ERROR_CODES.ACCOUNT_DISABLED]: 'Account disabled',
  [ERROR_CODES.TOO_MANY_LOGIN_ATTEMPTS]: 'Too many login attempts',
  [ERROR_CODES.PASSWORD_RESET_EXPIRED]: 'Password reset link expired',

  [ERROR_CODES.AUTHORIZATION_ERROR]: 'Access denied',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ERROR_CODES.ROLE_REQUIRED]: 'Role required',
  [ERROR_CODES.RESOURCE_ACCESS_DENIED]: 'Resource access denied',
  [ERROR_CODES.ADMIN_ACCESS_REQUIRED]: 'Admin access required',
  [ERROR_CODES.TEACHER_ACCESS_REQUIRED]: 'Teacher access required',
  [ERROR_CODES.STUDENT_ACCESS_REQUIRED]: 'Student access required',

  [ERROR_CODES.NOT_FOUND_ERROR]: 'Resource not found',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.COURSE_NOT_FOUND]: 'Course not found',
  [ERROR_CODES.LESSON_NOT_FOUND]: 'Lesson not found',
  [ERROR_CODES.ENROLLMENT_NOT_FOUND]: 'Enrollment not found',
  [ERROR_CODES.PAYMENT_NOT_FOUND]: 'Payment not found',
  [ERROR_CODES.FILE_NOT_FOUND]: 'File not found',

  [ERROR_CODES.CONFLICT_ERROR]: 'Resource conflict',
  [ERROR_CODES.USER_ALREADY_EXISTS]: 'User already exists',
  [ERROR_CODES.EMAIL_ALREADY_REGISTERED]: 'Email already registered',
  [ERROR_CODES.COURSE_ALREADY_ENROLLED]: 'Already enrolled in course',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'Duplicate entry',
  [ERROR_CODES.RESOURCE_IN_USE]: 'Resource in use',

  [ERROR_CODES.RATE_LIMIT_ERROR]: 'Rate limit exceeded',
  [ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many requests',
  [ERROR_CODES.API_RATE_LIMIT_EXCEEDED]: 'API rate limit exceeded',
  [ERROR_CODES.LOGIN_RATE_LIMIT_EXCEEDED]: 'Login rate limit exceeded',

  [ERROR_CODES.DATABASE_ERROR]: 'Database error',
  [ERROR_CODES.CONNECTION_FAILED]: 'Database connection failed',
  [ERROR_CODES.QUERY_FAILED]: 'Database query failed',
  [ERROR_CODES.TRANSACTION_FAILED]: 'Database transaction failed',
  [ERROR_CODES.CONSTRAINT_VIOLATION]: 'Database constraint violation',
  [ERROR_CODES.DUPLICATE_KEY]: 'Duplicate key',

  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ERROR_CODES.PAYMENT_GATEWAY_ERROR]: 'Payment gateway error',
  [ERROR_CODES.EMAIL_SERVICE_ERROR]: 'Email service error',
  [ERROR_CODES.STORAGE_SERVICE_ERROR]: 'Storage service error',
  [ERROR_CODES.THIRD_PARTY_API_ERROR]: 'Third-party API error',

  [ERROR_CODES.FILE_UPLOAD_ERROR]: 'File upload error',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File too large',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type',
  [ERROR_CODES.FILE_CORRUPTED]: 'File corrupted',
  [ERROR_CODES.UPLOAD_FAILED]: 'Upload failed',

  [ERROR_CODES.PAYMENT_ERROR]: 'Payment error',
  [ERROR_CODES.PAYMENT_DECLINED]: 'Payment declined',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds',
  [ERROR_CODES.PAYMENT_METHOD_INVALID]: 'Invalid payment method',
  [ERROR_CODES.REFUND_FAILED]: 'Refund failed',

  [ERROR_CODES.ENROLLMENT_ERROR]: 'Enrollment error',
  [ERROR_CODES.COURSE_FULL]: 'Course is full',
  [ERROR_CODES.PREREQUISITE_NOT_MET]: 'Prerequisite not met',
  [ERROR_CODES.ENROLLMENT_CLOSED]: 'Enrollment closed',
  [ERROR_CODES.MAX_ENROLLMENTS_EXCEEDED]: 'Max enrollments exceeded',

  [ERROR_CODES.JWT_ERROR]: 'JWT token error',
  [ERROR_CODES.JWT_MALFORMED]: 'JWT token malformed',
  [ERROR_CODES.JWT_SIGNATURE_INVALID]: 'JWT signature invalid',
  [ERROR_CODES.JWT_ISSUER_INVALID]: 'JWT issuer invalid',
  [ERROR_CODES.JWT_AUDIENCE_INVALID]: 'JWT audience invalid',

  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 'Business logic error',
  [ERROR_CODES.COURSE_NOT_PUBLISHED]: 'Course not published',
  [ERROR_CODES.LESSON_NOT_AVAILABLE]: 'Lesson not available',
  [ERROR_CODES.CERTIFICATE_NOT_ELIGIBLE]: 'Certificate not eligible',
  [ERROR_CODES.PROGRESS_INSUFFICIENT]: 'Progress insufficient',

  [ERROR_CODES.MAINTENANCE_ERROR]: 'System maintenance',
  [ERROR_CODES.SYSTEM_MAINTENANCE]: 'System under maintenance',
  [ERROR_CODES.SCHEDULED_MAINTENANCE]: 'Scheduled maintenance',
  [ERROR_CODES.EMERGENCY_MAINTENANCE]: 'Emergency maintenance',

  [ERROR_CODES.INTERNAL_ERROR]: 'Internal system error',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Unknown error',
  [ERROR_CODES.CONFIGURATION_ERROR]: 'Configuration error',
  [ERROR_CODES.MIDDLEWARE_ERROR]: 'Middleware error',
} as const;
