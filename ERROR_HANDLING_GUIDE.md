# 🚨 **LMS Backend Error Handling System Guide**

## 📋 **Tổng quan**

Hệ thống error handling tập trung được xây dựng để:
- ✅ **Xử lý tất cả loại errors một cách nhất quán**
- ✅ **Cung cấp error responses có cấu trúc rõ ràng**
- ✅ **Hỗ trợ đa ngôn ngữ (Tiếng Việt & Tiếng Anh)**
- ✅ **Tracking errors với Request ID**
- ✅ **Xử lý errors theo môi trường (Development/Production)**

## 🏗️ **Cấu trúc hệ thống**

### **1. Custom Error Classes (`src/shared/utils/errors.ts`)**
```typescript
// Base error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly details?: any;
}

// Specific error classes
export class ValidationError extends AppError { ... }
export class AuthenticationError extends AppError { ... }
export class AuthorizationError extends AppError { ... }
export class NotFoundError extends AppError { ... }
export class ConflictError extends AppError { ... }
export class RateLimitError extends AppError { ... }
export class DatabaseError extends AppError { ... }
export class ExternalServiceError extends AppError { ... }
export class FileUploadError extends AppError { ... }
export class PaymentError extends AppError { ... }
export class EnrollmentError extends AppError { ... }
export class JWTError extends AppError { ... }
export class BusinessLogicError extends AppError { ... }
export class MaintenanceError extends AppError { ... }
```

### **2. Error Factory (`src/shared/utils/errors.ts`)**
```typescript
export class ErrorFactory {
  static validation(message: string, details?: any): ValidationError { ... }
  static authentication(message: string, details?: any): AuthenticationError { ... }
  static authorization(message: string, details?: any): AuthorizationError { ... }
  static notFound(message: string, details?: any): NotFoundError { ... }
  static conflict(message: string, details?: any): ConflictError { ... }
  static rateLimit(message: string, details?: any): RateLimitError { ... }
  static database(message: string, details?: any): DatabaseError { ... }
  static externalService(message: string, details?: any): ExternalServiceError { ... }
  static fileUpload(message: string, details?: any): FileUploadError { ... }
  static payment(message: string, details?: any): PaymentError { ... }
  static enrollment(message: string, details?: any): EnrollmentError { ... }
  static jwt(message: string, details?: any): JWTError { ... }
  static businessLogic(message: string, details?: any): BusinessLogicError { ... }
  static maintenance(message: string, details?: any): MaintenanceError { ... }
}
```

### **3. Error Response Format**
```typescript
interface ErrorResponse {
  success: false;
  error: {
    message: string;        // Localized error message
    code: string;          // Error code (e.g., 'VALIDATION_ERROR')
    statusCode: number;    // HTTP status code
    timestamp: string;     // ISO timestamp
    path: string;          // Request path
    details?: any;         // Additional error details
    requestId?: string;    // Unique request identifier
  };
}
```

## 🔧 **Cách sử dụng**

### **1. Tạo custom errors**
```typescript
import { ErrorFactory } from '../utils/errors';

// Trong controller hoặc service
if (!user) {
  throw ErrorFactory.notFound('User not found', { userId: id });
}

if (!hasPermission) {
  throw ErrorFactory.authorization('Insufficient permissions', { 
    requiredPermission: 'admin:users:delete',
    userPermission: user.permissions 
  });
}

if (duplicateEmail) {
  throw ErrorFactory.conflict('Email already exists', { email });
}
```

### **2. Sử dụng trong routes với asyncHandler**
```typescript
import { asyncHandler } from '../middleware/errorHandler';

router.get('/users/:id', asyncHandler(async (req, res, next) => {
  const user = await UserService.findById(req.params.id);
  if (!user) {
    throw ErrorFactory.notFound('User not found', { userId: req.params.id });
  }
  res.json({ success: true, data: user });
}));
```

### **3. Sử dụng trong middleware**
```typescript
import { ErrorFactory } from '../utils/errors';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.roles.includes('admin')) {
    throw ErrorFactory.authorization('Admin access required', {
      userRoles: req.user?.roles || [],
      requiredRole: 'admin'
    });
  }
  next();
};
```

## 🌐 **Đa ngôn ngữ**

### **1. Tự động detect ngôn ngữ**
```typescript
// Từ Accept-Language header
Accept-Language: vi,en;q=0.9

// Hoặc custom header
X-Language: vi
```

### **2. Error messages theo ngôn ngữ**
```typescript
// Tiếng Việt
{
  "message": "Dữ liệu không hợp lệ",
  "code": "VALIDATION_ERROR"
}

// Tiếng Anh
{
  "message": "Validation failed",
  "code": "VALIDATION_ERROR"
}
```

## 📊 **Error Codes System**

### **1. Validation Errors (1000-1999)**
- `1000`: VALIDATION_ERROR
- `1001`: INVALID_INPUT
- `1002`: MISSING_REQUIRED_FIELD
- `1003`: INVALID_FORMAT
- `1004`: FIELD_TOO_LONG
- `1005`: FIELD_TOO_SHORT
- `1006`: INVALID_EMAIL
- `1007`: INVALID_PASSWORD
- `1008`: INVALID_PHONE
- `1009`: INVALID_URL
- `1010`: INVALID_DATE
- `1011`: INVALID_ENUM_VALUE
- `1012`: INVALID_MONGO_ID

### **2. Authentication Errors (2000-2999)**
- `2000`: AUTHENTICATION_ERROR
- `2001`: INVALID_CREDENTIALS
- `2002`: TOKEN_EXPIRED
- `2003`: TOKEN_INVALID
- `2004`: TOKEN_MISSING
- `2005`: REFRESH_TOKEN_INVALID
- `2006`: ACCOUNT_LOCKED
- `2007`: ACCOUNT_DISABLED
- `2008`: TOO_MANY_LOGIN_ATTEMPTS
- `2009`: PASSWORD_RESET_EXPIRED

### **3. Authorization Errors (3000-3999)**
- `3000`: AUTHORIZATION_ERROR
- `3001`: INSUFFICIENT_PERMISSIONS
- `3002`: ROLE_REQUIRED
- `3003`: RESOURCE_ACCESS_DENIED
- `3004`: ADMIN_ACCESS_REQUIRED
- `3005`: TEACHER_ACCESS_REQUIRED
- `3006`: STUDENT_ACCESS_REQUIRED

### **4. Not Found Errors (4000-4999)**
- `4000`: NOT_FOUND_ERROR
- `4001`: USER_NOT_FOUND
- `4002`: COURSE_NOT_FOUND
- `4003`: LESSON_NOT_FOUND
- `4004`: ENROLLMENT_NOT_FOUND
- `4005`: PAYMENT_NOT_FOUND
- `4006`: FILE_NOT_FOUND

### **5. Conflict Errors (5000-5999)**
- `5000`: CONFLICT_ERROR
- `5001`: USER_ALREADY_EXISTS
- `5002`: EMAIL_ALREADY_REGISTERED
- `5003`: COURSE_ALREADY_ENROLLED
- `5004`: DUPLICATE_ENTRY
- `5005`: RESOURCE_IN_USE

### **6. Rate Limit Errors (6000-6999)**
- `6000`: RATE_LIMIT_ERROR
- `6001`: TOO_MANY_REQUESTS
- `6002`: API_RATE_LIMIT_EXCEEDED
- `6003`: LOGIN_RATE_LIMIT_EXCEEDED

### **7. Database Errors (7000-7999)**
- `7000`: DATABASE_ERROR
- `7001`: CONNECTION_FAILED
- `7002`: QUERY_FAILED
- `7003`: TRANSACTION_FAILED
- `7004`: CONSTRAINT_VIOLATION
- `7005`: DUPLICATE_KEY

### **8. External Service Errors (8000-8999)**
- `8000`: EXTERNAL_SERVICE_ERROR
- `8001`: PAYMENT_GATEWAY_ERROR
- `8002`: EMAIL_SERVICE_ERROR
- `8003`: STORAGE_SERVICE_ERROR
- `8004`: THIRD_PARTY_API_ERROR

### **9. File Upload Errors (9000-9999)**
- `9000`: FILE_UPLOAD_ERROR
- `9001`: FILE_TOO_LARGE
- `9002`: INVALID_FILE_TYPE
- `9003`: FILE_CORRUPTED
- `9004`: UPLOAD_FAILED

### **10. Payment Errors (10000-10999)**
- `10000`: PAYMENT_ERROR
- `10001`: PAYMENT_DECLINED
- `10002`: INSUFFICIENT_FUNDS
- `10003`: PAYMENT_METHOD_INVALID
- `10004`: REFUND_FAILED

### **11. Enrollment Errors (11000-11999)**
- `11000`: ENROLLMENT_ERROR
- `11001`: COURSE_FULL
- `11002`: PREREQUISITE_NOT_MET
- `11003`: ENROLLMENT_CLOSED
- `11004`: MAX_ENROLLMENTS_EXCEEDED

### **12. JWT Errors (12000-12999)**
- `12000`: JWT_ERROR
- `12001`: JWT_MALFORMED
- `12002`: JWT_SIGNATURE_INVALID
- `12003`: JWT_ISSUER_INVALID
- `12004`: JWT_AUDIENCE_INVALID

### **13. Business Logic Errors (13000-13999)**
- `13000`: BUSINESS_LOGIC_ERROR
- `13001`: COURSE_NOT_PUBLISHED
- `13002`: LESSON_NOT_AVAILABLE
- `13003`: CERTIFICATE_NOT_ELIGIBLE
- `13004`: PROGRESS_INSUFFICIENT

### **14. Maintenance Errors (14000-14999)**
- `14000`: MAINTENANCE_ERROR
- `14001`: SYSTEM_MAINTENANCE
- `14002`: SCHEDULED_MAINTENANCE
- `14003`: EMERGENCY_MAINTENANCE

### **15. Internal Server Errors (15000-15999)**
- `15000`: INTERNAL_ERROR
- `15001`: UNKNOWN_ERROR
- `15002`: CONFIGURATION_ERROR
- `15003`: MIDDLEWARE_ERROR

## 🔄 **Error Handling Flow**

### **1. Request Flow**
```
Request → Request ID Middleware → Route Handler → Error Handler → Response
```

### **2. Error Handling Chain**
```
Route Handler throws error
    ↓
Global Error Handler catches error
    ↓
Error Formatter formats error response
    ↓
Response sent with proper status code and headers
```

### **3. Middleware Order**
```typescript
app.use(requestIdMiddleware);           // Add request ID
app.use(/* other middleware */);        // Authentication, validation, etc.
app.use(/* routes */);                  // API routes
app.use(notFoundHandler);               // 404 handler
app.use(errorLoggingMiddleware);        // Log errors
app.use(databaseErrorHandler);          // Handle database errors
app.use(validationErrorHandler);        // Handle validation errors
app.use(globalErrorHandler);            // Global error handler
```

## 📝 **Ví dụ sử dụng**

### **1. Controller với error handling**
```typescript
import { asyncHandler } from '../middleware/errorHandler';
import { ErrorFactory } from '../utils/errors';

export class UserController {
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ErrorFactory.validation('Invalid user ID format', { userId: id });
    }
    
    const user = await User.findById(id);
    if (!user) {
      throw ErrorFactory.notFound('User not found', { userId: id });
    }
    
    res.json({ success: true, data: user });
  });
  
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ErrorFactory.conflict('Email already registered', { email });
    }
    
    // Create user
    const user = await User.create({ email, password, name });
    res.status(201).json({ success: true, data: user });
  });
}
```

### **2. Service với error handling**
```typescript
import { ErrorFactory } from '../utils/errors';

export class UserService {
  static async findByEmail(email: string) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw ErrorFactory.notFound('User not found', { email });
      }
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to find user', { email, error: error.message });
    }
  }
  
  static async updateUser(id: string, updateData: any) {
    try {
      const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      if (!user) {
        throw ErrorFactory.notFound('User not found', { userId: id });
      }
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        throw ErrorFactory.validation('User validation failed', {
          userId: id,
          validationErrors: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message,
            value: err.value
          }))
        });
      }
      
      throw ErrorFactory.database('Failed to update user', { userId: id, error: error.message });
    }
  }
}
```

### **3. Middleware với error handling**
```typescript
import { ErrorFactory } from '../utils/errors';

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ErrorFactory.authentication('User not authenticated');
    }
    
    if (!req.user.roles.includes(requiredRole)) {
      throw ErrorFactory.authorization('Role required', {
        requiredRole,
        userRoles: req.user.roles
      });
    }
    
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ErrorFactory.authentication('User not authenticated');
    }
    
    if (!hasPermission(req.user, permission)) {
      throw ErrorFactory.authorization('Permission required', {
        requiredPermission: permission,
        userPermissions: req.user.permissions
      });
    }
    
    next();
  };
};
```

## 🚨 **Error Response Examples**

### **1. Validation Error**
```json
{
  "success": false,
  "error": {
    "message": "Dữ liệu không hợp lệ",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/users",
    "details": {
      "validationErrors": [
        {
          "field": "email",
          "message": "Email không hợp lệ",
          "value": "invalid-email",
          "location": "body"
        },
        {
          "field": "password",
          "message": "Mật khẩu phải có ít nhất 8 ký tự",
          "value": "123",
          "location": "body"
        }
      ],
      "totalErrors": 2
    },
    "requestId": "req_1705312200000_abc123def"
  }
}
```

### **2. Authentication Error**
```json
{
  "success": false,
  "error": {
    "message": "Token đã hết hạn",
    "code": "TOKEN_EXPIRED",
    "statusCode": 401,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/users/profile",
    "details": {
      "expiredAt": "2024-01-15T10:25:00.000Z",
      "currentTime": "2024-01-15T10:30:00.000Z"
    },
    "requestId": "req_1705312200000_abc123def"
  }
}
```

### **3. Database Error**
```json
{
  "success": false,
  "error": {
    "message": "Dữ liệu trùng lặp",
    "code": "DUPLICATE_KEY",
    "statusCode": 409,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/users",
    "details": {
      "duplicateField": ["email"],
      "duplicateValue": { "email": "user@example.com" },
      "collection": "users",
      "index": "email_1"
    },
    "requestId": "req_1705312200000_abc123def"
  }
}
```

### **4. Not Found Error**
```json
{
  "success": false,
  "error": {
    "message": "Không tìm thấy người dùng",
    "code": "USER_NOT_FOUND",
    "statusCode": 404,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/users/507f1f77bcf86cd799439011",
    "details": {
      "userId": "507f1f77bcf86cd799439011"
    },
    "requestId": "req_1705312200000_abc123def"
  }
}
```

## 🔧 **Configuration**

### **1. Environment Variables**
```bash
# Error handling configuration
NODE_ENV=development                    # development/production
ERROR_LOG_LEVEL=error                   # error/warn/info/debug
ERROR_INCLUDE_STACK=true               # Include stack trace in development
ERROR_INCLUDE_REQUEST_DETAILS=true     # Include request details in development
```

### **2. Error Logging**
```typescript
// Error logging configuration
export const ERROR_LOGGING_CONFIG = {
  level: process.env.ERROR_LOG_LEVEL || 'error',
  includeStack: process.env.ERROR_INCLUDE_STACK === 'true',
  includeRequestDetails: process.env.ERROR_INCLUDE_REQUEST_DETAILS === 'true',
  logToFile: process.env.ERROR_LOG_TO_FILE === 'true',
  logFilePath: process.env.ERROR_LOG_FILE_PATH || './logs/errors.log',
};
```

## 📚 **Best Practices**

### **1. Error Creation**
- ✅ Sử dụng `ErrorFactory` để tạo errors
- ✅ Cung cấp `details` hữu ích cho debugging
- ✅ Sử dụng error codes phù hợp
- ✅ Đặt `isOperational` đúng cho từng loại error

### **2. Error Handling**
- ✅ Luôn sử dụng `asyncHandler` cho async routes
- ✅ Throw errors thay vì return error responses
- ✅ Handle specific errors trước khi handle generic errors
- ✅ Log errors với context đầy đủ

### **3. Error Responses**
- ✅ Không expose sensitive information trong production
- ✅ Cung cấp error messages rõ ràng và hữu ích
- ✅ Include request ID để tracking
- ✅ Sử dụng HTTP status codes phù hợp

### **4. Error Logging**
- ✅ Log tất cả errors với context đầy đủ
- ✅ Include request ID trong log messages
- ✅ Log errors theo severity level
- ✅ Rotate log files để tránh disk space issues

## 🚀 **Advanced Features**

### **1. Error Aggregation**
```typescript
// Collect multiple errors and send as one response
export const aggregateErrors = (errors: AppError[]): AppError => {
  const aggregatedError = new AppError(
    'Multiple errors occurred',
    400,
    'AGGREGATED_ERROR',
    true,
    {
      errors: errors.map(err => ({
        message: err.message,
        code: err.errorCode,
        details: err.details
      })),
      totalErrors: errors.length
    }
  );
  
  return aggregatedError;
};
```

### **2. Error Recovery**
```typescript
// Attempt to recover from certain errors
export const attemptErrorRecovery = async (error: AppError, context: any): Promise<any> => {
  if (error instanceof DatabaseError && error.details?.retryable) {
    // Retry database operation
    return await retryDatabaseOperation(context);
  }
  
  if (error instanceof ExternalServiceError && error.details?.retryable) {
    // Retry external service call
    return await retryExternalServiceCall(context);
  }
  
  throw error;
};
```

### **3. Error Metrics**
```typescript
// Track error metrics for monitoring
export const trackErrorMetrics = (error: AppError, req: Request): void => {
  const metrics = {
    errorCode: error.errorCode,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  };
  
  // Send to metrics service
  MetricsService.recordError(metrics);
};
```

## 🔍 **Testing Error Handling**

### **1. Unit Tests**
```typescript
import { ErrorFactory } from '../utils/errors';

describe('ErrorFactory', () => {
  it('should create validation error with details', () => {
    const error = ErrorFactory.validation('Invalid input', { field: 'email' });
    
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual({ field: 'email' });
  });
});
```

### **2. Integration Tests**
```typescript
describe('Error Handling Integration', () => {
  it('should return proper error response for invalid user ID', async () => {
    const response = await request(app)
      .get('/api/users/invalid-id')
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_MONGO_ID');
    expect(response.body.error.requestId).toBeDefined();
  });
});
```

## 📚 **Tài liệu tham khảo**

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Node.js Error Handling Best Practices](https://nodejs.org/en/docs/guides/error-handling/)
- [MongoDB Error Codes](https://docs.mongodb.com/manual/reference/error-codes/)
- [Mongoose Error Handling](https://mongoosejs.com/docs/api.html#error-Error)

---

**Lưu ý**: Hệ thống error handling này được thiết kế để xử lý tất cả loại errors một cách nhất quán và cung cấp thông tin hữu ích cho developers và users.
