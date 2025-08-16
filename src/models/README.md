# 📚 LMS Database Models

Tài liệu này mô tả tất cả các MongoDB models được sử dụng trong hệ thống LMS.

## 🗂️ Models Overview

### Core Models
- **User** - Quản lý người dùng (student, teacher, admin)
- **Course** - Quản lý khóa học
- **Section** - Quản lý các phần của khóa học
- **Lesson** - Quản lý bài học
- **Assignment** - Quản lý bài tập
- **Submission** - Quản lý bài nộp của học viên

### Business Models
- **Enrollment** - Quản lý việc đăng ký khóa học
- **Bill** - Quản lý hóa đơn thanh toán
- **RefundRequest** - Quản lý yêu cầu hoàn tiền
- **CourseRating** - Quản lý đánh giá và báo cáo khóa học

## 🔗 Relationships

```
User (Student) ←→ Enrollment ←→ Course ←→ Section ←→ Lesson ←→ Assignment
     ↓              ↓           ↓         ↓         ↓         ↓
CourseRating    Bill      Instructor   Lesson   Submission
     ↓              ↓
RefundRequest  Payment
```

## 📊 Database Schema

### User Collection
- **Fields**: email, password, name, roles, subscriptionPlan, stats, etc.
- **Indexes**: email, roles, isActive, createdAt
- **Validation**: Email format, password strength, role validation

### Course Collection
- **Fields**: title, description, instructorId, price, status, etc.
- **Indexes**: instructorId, domain, level, status, price
- **Validation**: Title length, price range, instructor validation

### Section Collection
- **Fields**: courseId, title, order, isVisible, totalLessons, etc.
- **Indexes**: courseId, order, isVisible
- **Validation**: Order validation, course existence

### Lesson Collection
- **Fields**: sectionId, courseId, title, content, type, etc.
- **Indexes**: sectionId, courseId, order, type
- **Validation**: Content type validation, section existence

### Assignment Collection
- **Fields**: lessonId, courseId, title, type, maxScore, etc.
- **Indexes**: lessonId, courseId, type, dueDate
- **Validation**: Score validation, question validation

### Submission Collection
- **Fields**: assignmentId, studentId, answers, score, status, etc.
- **Indexes**: assignmentId, studentId, status
- **Validation**: Submission content validation

### Enrollment Collection
- **Fields**: studentId, courseId, instructorId, progress, etc.
- **Indexes**: studentId, courseId, instructorId, status
- **Validation**: Unique enrollment, instructor validation

### Bill Collection
- **Fields**: studentId, courseId, amount, status, paymentMethod, etc.
- **Indexes**: studentId, courseId, status, paymentMethod
- **Validation**: Amount validation, purpose validation

### RefundRequest Collection
- **Fields**: studentId, courseId, billId, reason, status, etc.
- **Indexes**: studentId, courseId, billId, status
- **Validation**: Amount validation, bill existence

### CourseRating Collection
- **Fields**: courseId, studentId, type, rating, comment, etc.
- **Indexes**: courseId, studentId, type, rating
- **Validation**: Rating range, type validation

## 🚀 Features

### Virtual Fields
- Formatted amounts and dates
- Status colors and labels
- Time calculations
- Progress indicators

### Instance Methods
- Password comparison
- Progress updates
- Status changes
- Data validation

### Static Methods
- Find by criteria
- Aggregation queries
- Bulk operations
- Search functionality

### Middleware
- Password hashing
- Timestamp updates
- Data validation
- Relationship updates

## 📝 Usage Examples

### Creating a User
```typescript
import { User } from '../models';

const user = new User({
  email: 'student@example.com',
  password: 'password123',
  name: 'John Doe',
  roles: ['student']
});

await user.save();
```

### Finding Courses by Domain
```typescript
import { Course } from '../models';

const itCourses = await Course.findByDomain('IT');
```

### Updating Enrollment Progress
```typescript
import { Enrollment } from '../models';

const enrollment = await Enrollment.findOne({ studentId, courseId });
await enrollment.updateProgress(75);
```

## 🔧 Database Indexes

### Performance Indexes
- Compound indexes for common queries
- Text indexes for search functionality
- Sparse indexes for optional fields
- Unique indexes for data integrity

### Query Optimization
- Indexed fields for fast lookups
- Covered queries for common operations
- Aggregation pipeline optimization
- Connection pooling

## 🛡️ Data Validation

### Schema Validation
- Required field validation
- Data type validation
- Range validation
- Format validation

### Business Logic Validation
- Relationship validation
- Status transition validation
- Amount validation
- Permission validation

### Error Handling
- Validation error messages
- Graceful error handling
- Transaction rollback
- Data consistency

## 📈 Performance Considerations

### Index Strategy
- Selective indexing
- Compound index optimization
- Background index creation
- Index maintenance

### Query Optimization
- Projection optimization
- Aggregation optimization
- Connection management
- Caching strategy

### Data Modeling
- Denormalization for read performance
- Normalization for data integrity
- Sharding strategy
- Backup and recovery

## 🔄 Migration & Updates

### Schema Evolution
- Backward compatibility
- Data migration scripts
- Version management
- Rollback procedures

### Data Updates
- Bulk update operations
- Incremental updates
- Validation during updates
- Audit trail maintenance

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Database Design Best Practices](https://docs.mongodb.com/manual/data-modeling/)
- [Performance Best Practices](https://docs.mongodb.com/manual/core/performance-optimization/)
