# 🚀 Hướng dẫn Chạy Seed Database LMS

## 📋 Yêu cầu hệ thống

### 1. **Node.js & npm**
- Node.js version 16+ 
- npm version 8+
- Kiểm tra: `node --version` và `npm --version`

### 2. **MongoDB**
- MongoDB local hoặc remote
- Connection string hợp lệ
- Database quyền read/write

### 3. **Dependencies**
- Tất cả packages đã được cài đặt: `npm install`

## 🚀 Cách chạy Seed Database

### **Phương pháp 1: Sử dụng npm script (Khuyến nghị)**

```bash
# Chạy seed với MongoDB local
npm run seed

# Chạy seed với environment variables
npm run seed:dev

# Reset database (xóa dữ liệu cũ + seed mới)
npm run db:reset

# Validate dữ liệu đã seed
npm run validate

# Validate với environment variables
npm run validate:dev
```

### **Phương pháp 2: Sử dụng script tự động**

#### **Windows (Batch file):**
```bash
# Double-click vào file
scripts/seed.bat

# Hoặc chạy từ command line
scripts/seed.bat

# Validate dữ liệu
scripts/validate_seed.bat
```

#### **PowerShell:**
```powershell
# Chạy script PowerShell
.\scripts\seed.ps1

# Hoặc nếu bị block execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\seed.ps1

# Validate dữ liệu
.\scripts\validate_seed.ps1
```

### **Phương pháp 3: Chạy trực tiếp với ts-node**

```bash
# Chạy với ts-node
npx ts-node -r tsconfig-paths/register src/scripts/seeds/seed_real_data.ts

# Chạy với dotenv
npx ts-node -r dotenv/config -r tsconfig-paths/register src/scripts/seeds/seed_real_data.ts
```

## ⚙️ Cấu hình Environment

### **Tạo file .env:**
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/lms

# Environment
NODE_ENV=development

# Optional: MongoDB Authentication
# MONGODB_USER=username
# MONGODB_PASS=password
# MONGODB_AUTH_SOURCE=admin
```

### **MongoDB URI Examples:**
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/lms

# MongoDB với authentication
MONGODB_URI=mongodb://username:password@localhost:27017/lms?authSource=admin

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lms?retryWrites=true&w=majority

# Docker MongoDB
MONGODB_URI=mongodb://localhost:27017/lms
```

## 🔍 Kiểm tra trước khi chạy

### **1. Kiểm tra MongoDB connection:**
```bash
# Test connection
npm run db:status

# Hoặc kiểm tra trực tiếp
mongosh "mongodb://localhost:27017/lms"
```

### **2. Kiểm tra dependencies:**
```bash
# Cài đặt dependencies
npm install

# Build project
npm run build

# Kiểm tra TypeScript
npm run type-check
```

### **3. Kiểm tra models:**
```bash
# Đảm bảo tất cả models được import đúng
# Kiểm tra file src/shared/models/index.ts
```

## 🎯 Kết quả mong đợi

### **Sau khi chạy thành công:**
```
🚀 Bắt đầu seeding database...
✅ Đã kết nối MongoDB
🧹 Xóa dữ liệu cũ...
✅ Đã xóa dữ liệu cũ
👥 Tạo users...
✅ Đã tạo 8 users
📚 Tạo courses...
✅ Đã tạo 5 courses
📖 Tạo sections...
✅ Đã tạo 5 sections
🎯 Tạo lessons...
✅ Đã tạo 5 lessons
📝 Tạo assignments...
✅ Đã tạo 3 assignments
🎓 Tạo enrollments...
✅ Đã tạo 40 enrollments
⭐ Tạo course reviews...
✅ Đã tạo 25 course reviews
👨‍🏫 Tạo teacher ratings...
✅ Đã tạo 6 teacher ratings
💬 Tạo comments...
✅ Đã tạo 5 comments
💰 Tạo payments và orders...
✅ Đã tạo 10 orders
✅ Đã tạo 10 payments
🏆 Tạo certificates...
✅ Đã tạo 12 certificates
🎉 Seeding hoàn thành thành công!

📊 Thống kê dữ liệu đã tạo:
- Users: 8
- Courses: 5
- Sections: 5
- Lessons: 5
- Assignments: 3
- Enrollments: 40
- Course Reviews: 25
- Teacher Ratings: 6
- Comments: 5
- Orders: 10
- Payments: 10
- Certificates: 12
```

## 🔐 Tài khoản test được tạo

### **Admin:**
- Email: `admin@lms.com`
- Password: `Admin@123`
- Role: `admin`

### **Teachers:**
- Email: `teacher1@lms.com` / Password: `Teacher@123`
- Email: `teacher2@lms.com` / Password: `Teacher@123`
- Role: `teacher`

### **Students:**
- Email: `student1@lms.com` đến `student5@lms.com`
- Password: `Student@123`
- Role: `student`

## 🐛 Troubleshooting

### **Lỗi thường gặp:**

#### **1. MongoDB Connection Failed:**
```bash
❌ Lỗi: connect ECONNREFUSED 127.0.0.1:27017
✅ Giải pháp: 
- Kiểm tra MongoDB có đang chạy không
- Kiểm tra port 27017
- Kiểm tra firewall
```

#### **2. Authentication Failed:**
```bash
❌ Lỗi: Authentication failed
✅ Giải pháp:
- Kiểm tra username/password trong .env
- Kiểm tra authSource
- Kiểm tra user permissions
```

#### **3. Schema Validation Error:**
```bash
❌ Lỗi: ValidationError
✅ Giải pháp:
- Kiểm tra model schema
- Kiểm tra required fields
- Kiểm tra data types
```

#### **4. Import Error:**
```bash
❌ Lỗi: Cannot find module
✅ Giải pháp:
- Chạy npm install
- Kiểm tra tsconfig-paths
- Kiểm tra import paths
```

### **Debug commands:**
```bash
# Kiểm tra MongoDB status
mongosh --eval "db.serverStatus()"

# Kiểm tra database
mongosh --eval "use lms; show collections"

# Kiểm tra logs
npm run dev 2>&1 | grep -i error
```

## 📊 Kiểm tra dữ liệu sau khi seed

### **1. Kết nối MongoDB:**
```bash
mongosh "mongodb://localhost:27017/lms"
```

### **2. Kiểm tra collections:**
```javascript
// Xem tất cả collections
show collections

// Đếm documents trong mỗi collection
db.users.countDocuments()
db.courses.countDocuments()
db.enrollments.countDocuments()
db.courseReviews.countDocuments()
```

### **3. Kiểm tra relationships:**
```javascript
// Kiểm tra enrollments có đúng instructor
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

## 🔍 Validation dữ liệu đã seed

### **Mục đích:**
Validation script sẽ kiểm tra:
- ✅ Tính đầy đủ của dữ liệu (required fields)
- ✅ Tính nhất quán của relationships (foreign keys)
- ✅ Logic nghiêm ngặt (completion dates, progress values)
- ✅ Tính hợp lệ của dữ liệu theo schema

### **Chạy validation:**
```bash
# Validate với npm script
npm run validate

# Validate với environment variables
npm run validate:dev

# Validate với script tự động
scripts/validate_seed.bat    # Windows Batch
scripts/validate_seed.ps1    # PowerShell
```

### **Kết quả validation mong đợi:**
```
🚀 Starting Seed Data Validation...
✅ Connected to MongoDB
🔍 Validating User Data...
✅ Found 8 users
- Admin users: 1
- Teacher users: 2
- Student users: 5
✅ User data validation passed
🔍 Validating Course Data...
✅ Found 5 courses
✅ Course data validation passed
🔍 Validating Enrollment Data...
✅ Found 40 enrollments
- Completed enrollments: 12
- Enrollments with completion date: 12
✅ Enrollment data validation passed
🔍 Validating Comment Data...
✅ Found 5 comments
✅ Comment data validation passed
🔍 Validating Certificate Data...
✅ Found 12 certificates
✅ Certificate data validation passed
🔍 Validating Overall Relationships...
✅ Relationship validation passed

🎉 All validations passed! Seed data is consistent and logical.
```

## 🎯 Lưu ý quan trọng

### **1. Backup trước khi seed:**
```bash
# Backup database hiện tại
mongodump --db lms --out ./backup/$(date +%Y%m%d_%H%M%S)
```

### **2. Seed chỉ trong development:**
```bash
# Không chạy seed trong production
if [ "$NODE_ENV" = "production" ]; then
  echo "❌ Không được chạy seed trong production!"
  exit 1
fi
```

### **3. Xóa dữ liệu cũ:**
```bash
# Script tự động xóa dữ liệu cũ
# Không cần làm gì thêm
```

### **4. Luôn validate sau khi seed:**
```bash
# Workflow khuyến nghị
npm run seed      # Chạy seed
npm run validate  # Validate dữ liệu
# Nếu validation pass → dữ liệu sẵn sàng sử dụng
# Nếu validation fail → kiểm tra lỗi và sửa
```

---

## 🚀 **Bắt đầu ngay:**

```bash
# 1. Chuyển vào thư mục lms-backend
cd lms-backend

# 2. Cài đặt dependencies
npm install

# 3. Chạy seed
npm run seed

# 4. Validate dữ liệu đã seed
npm run validate

# 5. Kiểm tra kết quả
mongosh "mongodb://localhost:27017/lms"
```

**🎉 Chúc bạn seeding thành công!**
