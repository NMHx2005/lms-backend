# 🚀 LMS Backend - Seed Data Documentation

## 📋 Tổng quan

Script `seed_real_data.ts` tạo dữ liệu mẫu thực tế cho hệ thống LMS với đầy đủ logic phụ thuộc và quan hệ giữa các model.

## 🗂️ Cấu trúc Dữ liệu

### 👥 Users (8 tài khoản)
- **1 Admin**: `admin@lms.com` / `Admin@123`
- **2 Teachers**: `teacher1@lms.com`, `teacher2@lms.com` / `Teacher@123`
- **5 Students**: `student1@lms.com` đến `student5@lms.com` / `Student@123`

### 📚 Courses (5 khóa học)
1. **Lập trình Web Frontend** - Giảng viên: teacher1
2. **React Native Mobile** - Giảng viên: teacher2  
3. **Machine Learning AI** - Giảng viên: teacher1
4. **UI/UX Design** - Giảng viên: teacher2
5. **DevOps CI/CD** - Giảng viên: teacher1

### 📖 Sections & Lessons (5 sections, 5 lessons)
- Chỉ tạo cho khóa học đầu tiên (Web Frontend)
- Mỗi section có 1 lesson tương ứng

### 📝 Assignments (3 bài tập)
- Tạo cho khóa học đầu tiên
- Bao gồm: HTML/CSS, JavaScript, React

### 🎓 Enrollments
- Tất cả students đăng ký tất cả courses
- Progress ngẫu nhiên 0-100%
- 30% khả năng hoàn thành

### ⭐ Reviews & Ratings
- **Course Reviews**: 5 reviews cho mỗi course
- **Teacher Ratings**: 3 ratings cho mỗi teacher
- **Comments**: 5 comments cho course đầu tiên

### 💰 Payments & Orders
- Tạo cho 10 enrollments đầu tiên
- Status: completed
- Payment method: credit_card

### 🏆 Certificates
- Tạo cho tất cả enrollments đã hoàn thành
- Verification code và QR code tự động

## 🔗 Logic Phụ thuộc

### Thứ tự tạo dữ liệu:
1. **Users** → Lấy ID cho reference
2. **Courses** → Gán instructorId từ teachers
3. **Sections** → Gán courseId từ course đầu tiên
4. **Lessons** → Gán courseId và sectionId
5. **Assignments** → Gán courseId
6. **Enrollments** → Gán studentId, courseId, instructorId
7. **Reviews/Ratings** → Gán các ID tương ứng
8. **Comments** → Gán authorId và contentId
9. **Orders** → Gán studentId và courseId
10. **Payments** → Gán orderId
11. **Certificates** → Gán các ID từ enrollments

### Quan hệ khóa chính - khóa phụ:
- `User._id` → `Course.instructorId`
- `User._id` → `Enrollment.studentId`
- `Course._id` → `Section.courseId`
- `Course._id` → `Lesson.courseId`
- `Course._id` → `Assignment.courseId`
- `Course._id` → `Enrollment.courseId`
- `Section._id` → `Lesson.sectionId`
- `User._id` → `CourseReview.studentId`
- `User._id` → `TeacherRating.studentId`
- `User._id` → `Comment.authorId`

## 🚀 Cách sử dụng

### 1. Chạy seed với MongoDB local:
```bash
npm run seed
```

### 2. Chạy seed với environment variables:
```bash
npm run seed:dev
```

### 3. Reset database:
```bash
npm run db:reset
```

## ⚙️ Cấu hình

### Environment Variables cần thiết:
```env
MONGODB_URI=mongodb://localhost:27017/lms
NODE_ENV=development
```

### Dependencies cần thiết:
- `mongoose`: Kết nối MongoDB
- `bcryptjs`: Hash password
- `dotenv`: Load environment variables

## 📊 Kết quả sau khi seed

### Số lượng records được tạo:
- **Users**: 8
- **Courses**: 5
- **Sections**: 5
- **Lessons**: 5
- **Assignments**: 3
- **Enrollments**: 40 (8 students × 5 courses)
- **Course Reviews**: 25 (5 reviews × 5 courses)
- **Teacher Ratings**: 6 (3 ratings × 2 teachers)
- **Comments**: 5
- **Orders**: 10
- **Payments**: 10
- **Certificates**: ~12 (30% của 40 enrollments)

## 🔍 Kiểm tra dữ liệu

### 1. Kiểm tra MongoDB:
```bash
# Kết nối MongoDB
mongosh

# Chọn database
use lms

# Xem collections
show collections

# Đếm records
db.users.countDocuments()
db.courses.countDocuments()
db.enrollments.countDocuments()
```

### 2. Kiểm tra quan hệ:
```javascript
// Kiểm tra enrollments có đúng instructorId
db.enrollments.aggregate([
  {
    $lookup: {
      from: "courses",
      localField: "courseId",
      foreignField: "_id",
      as: "course"
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "instructorId",
      foreignField: "_id",
      as: "instructor"
    }
  },
  {
    $project: {
      studentId: 1,
      courseTitle: { $arrayElemAt: ["$course.title", 0] },
      instructorName: { $arrayElemAt: ["$instructor.name", 0] }
    }
  }
])
```

## 🛠️ Tùy chỉnh dữ liệu

### Thêm users mới:
```typescript
const newUser = {
  email: 'newuser@lms.com',
  password: 'Password@123',
  name: 'Tên Người Dùng Mới',
  firstName: 'Tên',
  lastName: 'Người Dùng Mới',
  roles: ['student'],
  role: 'student',
  // ... các field khác
};
usersData.push(newUser);
```

### Thêm courses mới:
```typescript
const newCourse = {
  title: 'Khóa học mới',
  description: 'Mô tả khóa học',
  // ... các field khác
};
coursesData.push(newCourse);
```

### Thay đổi số lượng:
```typescript
// Tạo ít enrollments hơn
for (const course of courses.slice(0, 3)) { // Chỉ 3 courses đầu
  for (const student of studentUsers.slice(0, 4)) { // Chỉ 4 students đầu
    // ... tạo enrollment
  }
}
```

## ⚠️ Lưu ý quan trọng

### 1. **Password**: Tất cả passwords được hash với bcrypt
### 2. **Timestamps**: Tự động tạo với `timestamps: true`
### 3. **ObjectIds**: Tự động tạo bởi MongoDB
### 4. **Validation**: Dữ liệu tuân thủ schema validation
### 5. **Indexes**: Đảm bảo indexes đã được tạo trước khi seed

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **Connection failed**: Kiểm tra MongoDB URI và network
2. **Schema validation**: Kiểm tra model schema có đúng không
3. **Duplicate key**: Xóa dữ liệu cũ trước khi seed
4. **Memory limit**: Giảm số lượng records nếu quá lớn

### Debug:
```typescript
// Thêm console.log để debug
console.log('Users created:', users.map(u => ({ id: u._id, email: u.email })));
console.log('Courses created:', courses.map(c => ({ id: c._id, title: c.title })));
```

## 📈 Performance

### Tối ưu hóa:
- Sử dụng `insertMany()` thay vì `insertOne()`
- Tạo dữ liệu theo batch
- Sử dụng `Promise.all()` cho operations song song
- Disconnect MongoDB sau khi hoàn thành

### Thời gian chạy:
- **Local MongoDB**: ~2-5 giây
- **Remote MongoDB**: ~5-15 giây (tùy network)

---

**🎯 Mục tiêu**: Tạo dữ liệu mẫu thực tế để test và demo hệ thống LMS một cách toàn diện.
