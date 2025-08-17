# 🔄 **LMS Backend Validation Migration Guide**

## 📋 **Tổng quan Migration**

Hệ thống validation đã được chuẩn hóa từ **middleware functions** sang **express-validator arrays** để:
- ✅ **Tận dụng shared validation system**
- ✅ **Giảm duplication code**
- ✅ **Tăng tính nhất quán**
- ✅ **Dễ bảo trì và mở rộng**

## 🏗️ **Cấu trúc mới**

### **Before (Old System):**
```typescript
// ❌ Middleware functions
export const validateCreateCourse = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, domain, level, duration, price, instructorId } = req.body;
  
  if (!title || !description || !domain || !level || !duration || !price || !instructorId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: title, description, domain, level, duration, price, instructorId'
    });
  }
  // ... more validation logic
  next();
};
```

### **After (New System):**
```typescript
// ✅ Express-validator arrays
export const adminCourseValidation = {
  createCourse: [
    body('title').notEmpty().withMessage('Title is required'),
    commonValidations.name('title'),
    body('description').notEmpty().withMessage('Description is required'),
    commonValidations.description('description'),
    body('domain').notEmpty().withMessage('Domain is required'),
    body('domain').isLength({ min: 2, max: 100 }).trim().escape(),
    // ... more validation rules
  ]
};
```

## 🔧 **Cách sử dụng mới**

### **1. Import validation rules**
```typescript
import { validateRequest } from '../../shared/middleware/validation';
import { adminCourseValidation } from '../validators/course.validator';
```

### **2. Sử dụng trong routes**
```typescript
// Single validation
router.post('/', 
  validateRequest(adminCourseValidation.createCourse), 
  CourseController.createCourse
);

// Multiple validations (combine arrays)
router.put('/:id', 
  validateRequest([...adminCourseValidation.courseId, ...adminCourseValidation.updateCourse]), 
  CourseController.updateCourse
);
```

## 📁 **Files đã được cập nhật**

### **✅ Admin Validators:**
- `src/admin/validators/auth.validator.ts` - Sử dụng `commonValidations`
- `src/admin/validators/course.validator.ts` - Chuyển từ middleware functions sang arrays
- `src/admin/validators/index.ts` - Export validation mới

### **✅ Client Validators:**
- `src/client/validators/auth.validator.ts` - Sử dụng `commonValidations`

### **✅ Routes đã cập nhật:**
- `src/admin/routes/course.routes.ts` - Sử dụng `validateRequest` với validation arrays

## 🚀 **Benefits của hệ thống mới**

### **1. Tái sử dụng code:**
```typescript
// Trước: Mỗi validator viết lại logic
body('email').isEmail().withMessage('Please provide a valid email address')

// Sau: Sử dụng commonValidations
commonValidations.email('email')
```

### **2. Nhất quán validation rules:**
```typescript
// Tất cả email validation đều giống nhau
commonValidations.email('email') // normalizeEmail, trim, etc.
```

### **3. Dễ bảo trì:**
```typescript
// Thay đổi password policy ở một nơi
// src/shared/validators/constants.ts
MIN_PASSWORD: 8 → MIN_PASSWORD: 12

// Tất cả password validation sẽ tự động cập nhật
```

### **4. Type safety:**
```typescript
// Validation arrays có type checking
const validations: ValidationChain[] = [
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
];
```

## 🔄 **Migration Checklist**

### **Cho Admin Validators:**
- [x] `auth.validator.ts` - ✅ Đã cập nhật
- [x] `course.validator.ts` - ✅ Đã cập nhật
- [x] `user.validator.ts` - ✅ Đã cập nhật
- [x] `system.validator.ts` - ✅ Đã cập nhật
- [x] `support.validator.ts` - ✅ Đã cập nhật
- [x] `analytics.validator.ts` - ✅ Đã cập nhật

### **Cho Client Validators:**
- [x] `auth.validator.ts` - ✅ Đã cập nhật
- [x] `course.validator.ts` - ✅ Đã tạo mới
- [x] `user.validator.ts` - ✅ Đã tạo mới

### **Cho Routes:**
- [x] `src/admin/routes/course.routes.ts` - ✅ Đã cập nhật
- [x] `src/admin/routes/auth.routes.ts` - ✅ Đã cập nhật
- [x] `src/admin/routes/user.routes.ts` - ✅ Đã cập nhật
- [x] `src/admin/routes/system.routes.ts` - ✅ Đã cập nhật
- [x] `src/admin/routes/support.routes.ts` - ✅ Đã cập nhật
- [x] `src/admin/routes/analytics.routes.ts` - ✅ Đã cập nhật

## 📝 **Template cho validation mới**

### **1. Basic validation:**
```typescript
export const moduleValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required'),
    commonValidations.name('name'),
    body('description').optional(),
    commonValidations.description('description'),
  ],
  
  update: [
    body('name').optional(),
    commonValidations.name('name'),
    body('description').optional(),
    commonValidations.description('description'),
  ],
  
  id: [
    commonValidations.mongoId('id'),
  ],
  
  query: [
    ...commonValidations.pagination(),
    commonValidations.search('search'),
  ],
};
```

### **2. Route usage:**
```typescript
router.post('/', 
  validateRequest(moduleValidation.create), 
  controller.create
);

router.put('/:id', 
  validateRequest([...moduleValidation.id, ...moduleValidation.update]), 
  controller.update
);

router.get('/', 
  validateRequest(moduleValidation.query), 
  controller.list
);
```

## 🚨 **Lưu ý quan trọng**

### **1. Không mix old và new system:**
```typescript
// ❌ Không làm thế này
router.post('/', 
  validateCreateCourse, // Old middleware function
  CourseController.createCourse
);

// ✅ Làm thế này
router.post('/', 
  validateRequest(adminCourseValidation.createCourse), // New validation array
  CourseController.createCourse
);
```

### **2. Sử dụng commonValidations khi có thể:**
```typescript
// ❌ Viết lại validation
body('email').isEmail().withMessage('Please provide a valid email address')

// ✅ Sử dụng commonValidations
commonValidations.email('email')
```

### **3. Import đúng đường dẫn:**
```typescript
// ✅ Import từ shared validators
import { commonValidations } from '../../shared/validators/common.validator';
import { VALIDATION_CONSTANTS } from '../../shared/validators/constants';
```

## 🔍 **Testing Migration**

### **1. Build check:**
```bash
npm run build
# ✅ Should pass without errors
```

### **2. Runtime test:**
```bash
npm start
# ✅ API endpoints should work with new validation
```

### **3. Validation test:**
```bash
# Test với invalid data
curl -X POST /api/admin/courses \
  -H "Content-Type: application/json" \
  -d '{"title": "", "description": ""}'
# ✅ Should return validation errors
```

## 📚 **Tài liệu tham khảo**

- [Express Validator Documentation](https://express-validator.github.io/docs/)
- [Validation Rules Reference](https://github.com/validatorjs/validator.js#validators)
- [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md) - Hướng dẫn chi tiết validation system

---

**Lưu ý**: Migration này giúp chuẩn hóa toàn bộ validation system. Hãy cập nhật từng module một cách có hệ thống để đảm bảo tính ổn định.
