# 🚀 **LMS Backend Validation System Guide**

## 📋 **Tổng quan**

Hệ thống validation được xây dựng sử dụng `express-validator` với các tính năng:
- ✅ **Request body validation**
- ✅ **Query parameter validation** 
- ✅ **Path parameter validation**
- ✅ **File upload validation**
- ✅ **Custom validation rules**
- ✅ **Reusable validation components**

## 🏗️ **Cấu trúc thư mục**

```
src/shared/validators/
├── constants.ts          # Validation constants & limits
├── common.validator.ts   # Common validation rules
├── file.validator.ts     # File upload validation
├── auth.validator.ts     # Authentication validation
├── course.validator.ts   # Course validation
└── index.ts             # Export all validators
```

## 🔧 **Sử dụng cơ bản**

### **1. Import validation rules**

```typescript
import { validateRequest } from '../middleware/validation';
import { authValidation } from '../validators';

// Sử dụng trong route
router.post('/login', 
  validateRequest(authValidation.login), 
  authController.login
);
```

### **2. Sử dụng common validations**

```typescript
import { commonValidations } from '../validators';

const userValidation = {
  createUser: [
    commonValidations.email('email'),
    commonValidations.password('password'),
    commonValidations.name('name'),
    commonValidations.phone('phone').optional(),
  ]
};
```

### **3. File upload validation**

```typescript
import { validateImage, validateDocument } from '../validators';

router.post('/upload-avatar',
  upload.single('avatar'),
  validateImage('avatar'),
  userController.uploadAvatar
);
```

## 📝 **Validation Rules có sẵn**

### **Common Validations**

| Function | Mô tả | Ví dụ |
|----------|-------|-------|
| `email(field)` | Validate email format | `commonValidations.email('email')` |
| `password(field)` | Validate password strength | `commonValidations.password('password')` |
| `name(field)` | Validate name length | `commonValidations.name('name')` |
| `description(field)` | Validate description length | `commonValidations.description('bio')` |
| `phone(field)` | Validate phone number | `commonValidations.phone('phone')` |
| `url(field)` | Validate URL format | `commonValidations.url('website')` |
| `price(field)` | Validate price range | `commonValidations.price('amount')` |
| `duration(field)` | Validate duration (minutes) | `commonValidations.duration('length')` |
| `rating(field)` | Validate rating (1-5) | `commonValidations.rating('score')` |
| `percentage(field)` | Validate percentage (0-100) | `commonValidations.percentage('progress')` |
| `date(field)` | Validate date format | `commonValidations.date('birthDate')` |
| `mongoId(field)` | Validate MongoDB ObjectId | `commonValidations.mongoId('userId')` |
| `pagination()` | Validate pagination params | `...commonValidations.pagination()` |
| `search(field)` | Validate search term | `commonValidations.search('q')` |

### **File Upload Validations**

| Function | Mô tả | Ví dụ |
|----------|-------|-------|
| `validateImage(field)` | Validate image file | `validateImage('avatar')` |
| `validateDocument(field)` | Validate document file | `validateDocument('pdf')` |
| `validateVideo(field)` | Validate video file | `validateVideo('tutorial')` |
| `validateMultipleFiles(field, max, type)` | Validate multiple files | `validateMultipleFiles('gallery', 5, 'image')` |
| `validateFileSize(maxSize, field)` | Validate file size only | `validateFileSize(5 * 1024 * 1024, 'file')` |
| `validateFileType(types, field)` | Validate file type only | `validateFileType(['pdf', 'doc'], 'document')` |

## 🎯 **Ví dụ thực tế**

### **1. Course Creation Validation**

```typescript
import { body } from 'express-validator';
import { commonValidations } from '../validators';

export const courseValidation = {
  createCourse: [
    body('title').notEmpty().withMessage('Title is required'),
    commonValidations.name('title'),
    body('description').notEmpty().withMessage('Description is required'),
    commonValidations.description('description'),
    body('price').notEmpty().withMessage('Price is required'),
    commonValidations.price('price'),
    body('instructorId').notEmpty().withMessage('Instructor ID is required'),
    commonValidations.mongoId('instructorId'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
  ]
};
```

### **2. User Profile Update with File Upload**

```typescript
import { body } from 'express-validator';
import { commonValidations } from '../validators';
import { validateOptionalFile } from '../validators';

export const profileValidation = {
  updateProfile: [
    body('name').optional(),
    commonValidations.name('name'),
    body('phone').optional(),
    commonValidations.phone('phone'),
    body('bio').optional(),
    commonValidations.description('bio'),
  ]
};

// Route sử dụng
router.put('/profile',
  upload.single('avatar'),
  validateOptionalFile('image', 'avatar'),
  validateRequest(profileValidation.updateProfile),
  userController.updateProfile
);
```

### **3. Advanced Query Validation**

```typescript
export const courseQueryValidation = [
  ...commonValidations.pagination(),
  commonValidations.search('search'),
  query('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sortBy').optional().isIn(['title', 'price', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];
```

## 🔒 **Custom Validation Rules**

### **1. Business Logic Validation**

```typescript
body('endDate').custom((value, { req }) => {
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(value);
  
  if (endDate <= startDate) {
    throw new Error('End date must be after start date');
  }
  return true;
})
```

### **2. Conditional Validation**

```typescript
import { validateConditionally } from '../middleware/validation';

const conditionalValidation = validateConditionally(
  (req) => req.body.type === 'premium',
  [
    body('paymentMethod').notEmpty().withMessage('Payment method required for premium'),
    body('cardNumber').isCreditCard().withMessage('Valid credit card required'),
  ]
);
```

### **3. Nested Object Validation**

```typescript
import { customValidations } from '../validators';

const profileValidation = customValidations.nestedObject('profile', {
  avatar: commonValidations.url,
  phone: commonValidations.phone,
  address: body().isLength({ max: 200 }),
});
```

## ⚡ **Performance & Best Practices**

### **1. Validation Order**
```typescript
// 1. Sanitize input
sanitizeRequest(),

// 2. Validate required fields first
body('email').notEmpty().withMessage('Email is required'),

// 3. Validate format
commonValidations.email('email'),

// 4. Validate business rules
body('email').custom(async (value) => {
  const exists = await User.findOne({ email: value });
  if (exists) throw new Error('Email already exists');
  return true;
}),
```

### **2. Reuse Validation Rules**
```typescript
// Tạo base validation
const baseUserValidation = [
  commonValidations.email('email'),
  commonValidations.name('name'),
];

// Sử dụng cho nhiều endpoints
export const userValidation = {
  create: [...baseUserValidation, commonValidations.password('password')],
  update: baseUserValidation,
};
```

### **3. Error Handling**
```typescript
// Custom error handler
const customErrorHandler = (errors, req, res, next) => {
  const formattedErrors = errors.map(error => ({
    field: error.path,
    message: error.msg,
    code: 'VALIDATION_ERROR',
  }));
  
  res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: formattedErrors,
  });
};

// Sử dụng
validateRequestWithCustomHandler(validations, customErrorHandler)
```

## 🚨 **Error Codes & Messages**

### **Standard Error Format**
```typescript
{
  success: false,
  error: 'Validation failed',
  details: [
    {
      field: 'email',
      message: 'Please provide a valid email address',
      value: 'invalid-email'
    }
  ]
}
```

### **Error Codes**
- `1001` - Validation Error
- `2001` - Authentication Error  
- `2002` - Authorization Error
- `3001` - Not Found Error
- `3002` - Conflict Error
- `4001` - Rate Limit Error
- `5001` - Internal Error

## 📚 **Tài liệu tham khảo**

- [Express Validator Documentation](https://express-validator.github.io/docs/)
- [Validation Rules Reference](https://github.com/validatorjs/validator.js#validators)
- [Custom Validators](https://express-validator.github.io/docs/custom-validators-sanitizers.html)

## 🤝 **Đóng góp**

Khi thêm validation rules mới:
1. Sử dụng `commonValidations` khi có thể
2. Thêm constants vào `VALIDATION_CONSTANTS`
3. Cập nhật documentation
4. Viết test cases
5. Chạy `npm run build` để kiểm tra

---

**Lưu ý**: Hệ thống validation này được thiết kế để dễ sử dụng và mở rộng. Hãy tái sử dụng các rules có sẵn thay vì tạo mới từ đầu.
