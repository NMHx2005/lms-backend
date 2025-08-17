# 🛡️ **LMS Backend Security Guide**

## 📋 **Tổng quan**

Hệ thống bảo mật được thiết kế để bảo vệ ứng dụng LMS khỏi các mối đe dọa bảo mật phổ biến:

- ✅ **Rate Limiting**: Giới hạn số lượng request từ mỗi IP
- ✅ **CORS Protection**: Bảo vệ khỏi Cross-Origin Resource Sharing attacks
- ✅ **Helmet Security**: Security headers tự động
- ✅ **Input Sanitization**: Làm sạch input từ người dùng
- ✅ **MongoDB Sanitization**: Bảo vệ khỏi NoSQL injection
- ✅ **Request Validation**: Kiểm tra và validate request
- ✅ **Audit Logging**: Ghi log tất cả hoạt động quan trọng

## 🏗️ **Cấu trúc hệ thống**

### **1. Configuration Files**
```
src/shared/config/
├── security.ts              # Security configuration
└── database.ts              # Database configuration
```

### **2. Middleware**
```
src/shared/middleware/
├── security.ts              # Security middleware
├── rateLimiting.ts          # Rate limiting middleware
├── auth.ts                  # Authentication middleware
└── errorHandler.ts          # Error handling middleware
```

### **3. Security Features**
```
src/shared/middleware/security.ts
├── CORS Protection
├── Helmet Security Headers
├── MongoDB Sanitization
├── HPP Protection
├── Input Sanitization
├── Request Validation
├── Security Headers
├── Request Logging
├── Error Logging
└── Audit Logging
```

## 🔧 **Cài đặt & Configuration**

### **1. Dependencies**
```bash
npm install express-rate-limit express-slow-down express-mongo-sanitize hpp xss-clean
npm install --save-dev @types/express-rate-limit
```

### **2. Environment Variables**
```env
# Security Configuration
NODE_ENV=development
SESSION_SECRET=your_session_secret_key_here
TRUST_PROXY=false
ENABLE_RATE_LIMITING=true
ENABLE_SPEED_LIMITING=true
ENABLE_REQUEST_LOGGING=true
ENABLE_ERROR_LOGGING=true
ENABLE_AUDIT_LOGGING=true

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
UPLOAD_RATE_LIMIT_MAX=10
API_RATE_LIMIT_MAX=200
ADMIN_RATE_LIMIT_MAX=50

# Speed Limiting Configuration
SPEED_LIMIT_DELAY_AFTER=50
SPEED_LIMIT_DELAY_MS=500
SPEED_LIMIT_MAX_DELAY_MS=20000
UPLOAD_SPEED_LIMIT_DELAY_AFTER=5
UPLOAD_SPEED_LIMIT_DELAY_MS=1000
UPLOAD_SPEED_LIMIT_MAX_DELAY_MS=30000

# Request Configuration
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT_MS=30000
MAX_FILE_SIZE=10mb
MAX_FILES_PER_REQUEST=20

# CORS Configuration
CORS_ORIGIN_DEVELOPMENT=http://localhost:3000,http://localhost:3001,http://localhost:5173
CORS_ORIGIN_PRODUCTION=https://superadmin.dev.musashino-rag.io.vn,https://apidev.superadmin.musashino-rag.io.vn
CORS_ORIGIN_STAGING=https://staging.superadmin.musashino-rag.io.vn,https://staging-api.superadmin.musashino-rag.io.vn

# Helmet Configuration
HELMET_CONTENT_SECURITY_POLICY_DEVELOPMENT=true
HELMET_CONTENT_SECURITY_POLICY_PRODUCTION=true
HELMET_CROSS_ORIGIN_EMBEDDER_POLICY_DEVELOPMENT=false
HELMET_CROSS_ORIGIN_EMBEDDER_POLICY_PRODUCTION=true

# MongoDB Security
MONGO_SANITIZE_ENABLED=true
MONGO_SANITIZE_REPLACE_WITH=_
MONGO_SANITIZE_DRY_RUN=false

# HPP Configuration
HPP_WHITELIST=filter,sort,page,limit,fields,populate,select,lean

# Password Security
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true
PASSWORD_MAX_ATTEMPTS=5
PASSWORD_LOCKOUT_DURATION_MS=900000

# Database Security
DB_ENABLE_QUERY_LOGGING=false
DB_ENABLE_SLOW_QUERY_LOGGING=true
DB_SLOW_QUERY_THRESHOLD_MS=1000
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT_MS=30000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10mb
LOG_MAX_FILES=5

# File Upload Security
FILE_SCAN_FOR_VIRUSES=false
FILE_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain
FILE_MAX_SIZE=10mb
FILE_MAX_FILES=20
```

## 🚫 **Rate Limiting**

### **1. General Rate Limiting**
```typescript
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
  standardHeaders: true,
  legacyHeaders: false,
})
```

### **2. Authentication Rate Limiting**
```typescript
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
})
```

### **3. File Upload Rate Limiting**
```typescript
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
})
```

### **4. Admin Rate Limiting**
```typescript
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
})
```

## 🐌 **Speed Limiting**

### **1. General Speed Limiting**
```typescript
// General speed limit
general: slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
})
```

### **2. Upload Speed Limiting**
```typescript
// Speed limit for file uploads
upload: slowDown({
  windowMs: 60 * 60 * 1000, // 1 hour
  delayAfter: 5, // Allow 5 uploads per hour without delay
  delayMs: 1000, // Add 1 second delay per upload after delayAfter
  maxDelayMs: 30000, // Maximum delay of 30 seconds
})
```

## 🌐 **CORS Configuration**

### **1. Development CORS**
```typescript
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
}
```

### **2. Production CORS**
```typescript
production: {
  origin: [
    'https://superadmin.dev.musashino-rag.io.vn',
    'https://apidev.superadmin.musashino-rag.io.vn',
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
}
```

## 🪖 **Helmet Security Headers**

### **1. Development Helmet**
```typescript
development: {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}
```

### **2. Production Helmet**
```typescript
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
  crossOriginResourcePolicy: { policy: "same-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}
```

## 🧹 **Input Sanitization**

### **1. MongoDB Sanitization**
```typescript
mongoSanitizeConfig = {
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`MongoDB injection attempt detected: ${key} in ${req.originalUrl}`);
  },
  dryRun: false,
}
```

### **2. HPP Protection**
```typescript
hppConfig = {
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
}
```

### **3. Input Sanitization Function**
```typescript
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
```

## 📊 **Request Validation**

### **1. Content-Type Validation**
```typescript
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
```

### **2. Accept Header Validation**
```typescript
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
```

## 📝 **Logging & Monitoring**

### **1. Request Logging**
```typescript
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
```

### **2. Error Logging**
```typescript
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
```

### **3. Audit Logging**
```typescript
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
```

## 🚨 **Error Handling**

### **1. Rate Limit Errors**
```typescript
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
}
```

### **2. Request Size Errors**
```typescript
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
```

### **3. Request Timeout Errors**
```typescript
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
```

## 🔒 **Security Headers**

### **1. Custom Security Headers**
```typescript
// Add custom security headers
res.set({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
});
```

### **2. Production Security Headers**
```typescript
// Add environment-specific headers
if (process.env.NODE_ENV === 'production') {
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",
  });
}
```

## 🧪 **Testing Security**

### **1. Test Rate Limiting**
```bash
# Test general rate limiting
for i in {1..101}; do
  curl -X GET http://localhost:5000/api/health
done

# Test auth rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
done
```

### **2. Test Input Sanitization**
```bash
# Test MongoDB injection
curl -X GET "http://localhost:5000/api/users?email[$ne]=test@example.com"

# Test XSS injection
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"xss\")</script>","email":"test@example.com"}'
```

### **3. Test CORS**
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:5000/api/users \
  -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## 📚 **Best Practices**

### **1. Security Configuration**
- Sử dụng environment variables cho tất cả cấu hình bảo mật
- Không hardcode secrets trong code
- Sử dụng strong secrets và keys
- Rotate secrets định kỳ

### **2. Rate Limiting**
- Implement rate limiting cho tất cả public endpoints
- Sử dụng different limits cho different user roles
- Monitor rate limiting violations
- Adjust limits based on usage patterns

### **3. Input Validation**
- Validate tất cả input từ user
- Sanitize input trước khi xử lý
- Use parameterized queries
- Implement proper error handling

### **4. Logging & Monitoring**
- Log tất cả security events
- Monitor for suspicious activities
- Implement alerting for security violations
- Regular log analysis

### **5. Error Handling**
- Don't expose sensitive information in error messages
- Use consistent error response format
- Log errors for debugging
- Implement proper error codes

## 🔮 **Future Enhancements**

### **1. Planned Security Features**
- [ ] **Two-Factor Authentication (2FA)**
- [ ] **API Key Management**
- [ ] **IP Whitelisting/Blacklisting**
- [ ] **Advanced Threat Detection**
- [ ] **Security Metrics Dashboard**

### **2. Advanced Monitoring**
- [ ] **Real-time Security Alerts**
- [ ] **Behavioral Analysis**
- [ ] **Machine Learning Threat Detection**
- [ ] **Security Score Calculation**
- [ ] **Compliance Reporting**

---

## 📞 **Support**

Nếu có vấn đề gì với hệ thống bảo mật, vui lòng:
1. Kiểm tra logs trong console
2. Verify security configuration
3. Check environment variables
4. Contact security team

**Stay Secure! 🛡️**
