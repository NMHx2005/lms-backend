# 🎓 LMS Backend API

Hệ thống quản lý học tập (Learning Management System) backend API được xây dựng với Node.js, Express.js, TypeScript và MongoDB.

## 🚀 **Tính năng chính**

### **👥 Quản lý người dùng**
- Đăng ký, đăng nhập, xác thực JWT
- Quản lý profile và preferences
- Role-based access control (Student, Teacher, Admin)
- Quản lý subscription plans

### **📚 Quản lý khóa học**
- Tạo, chỉnh sửa, xóa khóa học
- Quản lý sections và lessons
- Hệ thống duyệt khóa học
- Tìm kiếm và lọc khóa học

### **🎯 Quản lý học tập**
- Đăng ký khóa học
- Theo dõi tiến độ học tập
- Quản lý bài tập và nộp bài
- Hệ thống chứng chỉ

### **💰 Quản lý thanh toán**
- Tích hợp payment gateway
- Quản lý hóa đơn và hoàn tiền
- Subscription management

### **📊 Analytics & Reporting**
- Thống kê người dùng và khóa học
- Báo cáo doanh thu
- Theo dõi hiệu suất hệ thống

## 🏗️ **Kiến trúc hệ thống**

```
src/
├── config/          # Cấu hình database, cloudinary
├── controllers/     # Business logic (admin/client)
├── middleware/      # Auth, CORS, validation, rate limiting
├── models/          # MongoDB schemas và interfaces
├── routes/          # API endpoints
│   ├── admin/       # Admin API routes
│   ├── client/      # Client API routes
│   └── auth.ts      # Authentication routes
├── services/        # Business logic services
├── utils/           # Helper functions, error handling
└── scripts/         # Database seeding, testing
```

## 🛠️ **Công nghệ sử dụng**

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Custom validation middleware
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer + Cloudinary
- **Payment**: Stripe integration
- **Email**: SendGrid integration
- **Deployment**: Docker

## 📋 **Yêu cầu hệ thống**

- Node.js 18.0.0 hoặc cao hơn
- MongoDB 5.0 hoặc cao hơn
- npm hoặc yarn

## 🚀 **Cài đặt và chạy**

### **1. Clone repository**
```bash
git clone <repository-url>
cd lms-backend
```

### **2. Cài đặt dependencies**
```bash
npm install
```

### **3. Cấu hình environment**
```bash
cp env.example .env
# Chỉnh sửa .env file với thông tin của bạn
```

### **4. Chạy development server**
```bash
npm run dev
```

### **5. Build production**
```bash
npm run build
npm start
```

## 🔧 **Scripts có sẵn**

```bash
npm run dev          # Chạy development server với nodemon
npm run build        # Build TypeScript
npm run start        # Chạy production server
npm run seed         # Seed database với dữ liệu mẫu
npm run test         # Chạy tests
npm run lint         # Kiểm tra code quality
npm run lint:fix     # Tự động fix linting errors
```

## 🌐 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - Đăng ký người dùng
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Làm mới token
- `GET /api/auth/profile` - Lấy thông tin profile

### **Admin API** (`/api/admin`)
- `GET /dashboard` - Dashboard tổng quan
- `GET /users` - Quản lý người dùng
- `GET /courses` - Quản lý khóa học
- `GET /analytics/*` - Thống kê và báo cáo
- `GET /system/*` - Quản lý hệ thống
- `GET /support/*` - Hỗ trợ và tickets

### **Client API** (`/api/client`)
- `GET /courses` - Xem danh sách khóa học
- `GET /courses/:id` - Chi tiết khóa học
- `POST /enrollments` - Đăng ký khóa học
- `GET /user/profile` - Quản lý profile
- `GET /assignments` - Quản lý bài tập
- `GET /payments/*` - Quản lý thanh toán

## 🔐 **Authentication & Authorization**

### **JWT Token Structure**
```typescript
interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}
```

### **Role-based Access Control**
- **Student**: Truy cập khóa học, nộp bài, xem tiến độ
- **Teacher**: Quản lý khóa học, chấm bài, xem thống kê
- **Admin**: Quản lý toàn bộ hệ thống, duyệt khóa học

### **Middleware Stack**
- `authenticate`: Xác thực JWT token
- `authorize`: Kiểm tra quyền truy cập
- `requireAdmin/Teacher/Student`: Role-specific guards
- `checkOwnership`: Kiểm tra quyền sở hữu resource

## 📊 **Database Schema**

### **Core Collections**
- **Users**: Thông tin người dùng và roles
- **Courses**: Khóa học và metadata
- **Sections**: Chương của khóa học
- **Lessons**: Bài học cụ thể
- **Assignments**: Bài tập và quiz
- **Submissions**: Bài nộp của học viên
- **Enrollments**: Đăng ký khóa học
- **Bills**: Hóa đơn thanh toán

### **Extended Collections**
- **RefundRequests**: Yêu cầu hoàn tiền
- **CourseRatings**: Đánh giá khóa học
- **SupportTickets**: Tickets hỗ trợ
- **AuditLogs**: Log hoạt động hệ thống

## 🔒 **Security Features**

- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Cross-origin resource sharing
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Data sanitization
- **Helmet Security**: HTTP security headers
- **Password Hashing**: bcrypt encryption

## 📈 **Performance & Scalability**

- **Database Indexing**: Optimized queries
- **Connection Pooling**: MongoDB connection management
- **Async/Await**: Non-blocking I/O operations
- **Error Handling**: Comprehensive error management
- **Logging**: Structured logging system

## 🧪 **Testing**

### **Unit Tests**
```bash
npm run test
```

### **Database Testing**
```bash
npm run db:status
npm run test:cors
```

## 🐳 **Docker Deployment**

### **Build Image**
```bash
docker build -t lms-backend .
```

### **Run Container**
```bash
docker run -p 5000:5000 lms-backend
```

### **Docker Compose**
```bash
docker compose up --build
```

## 📝 **Environment Variables**

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/lms_database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🤝 **Contributing**

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 **License**

Dự án này được cấp phép theo MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📞 **Support**

Nếu bạn gặp vấn đề hoặc có câu hỏi:

- Tạo issue trên GitHub
- Liên hệ team development
- Xem documentation chi tiết

## 🎯 **Roadmap**

### **Phase 1** ✅
- [x] Core API structure
- [x] User authentication
- [x] Basic CRUD operations
- [x] Database models

### **Phase 2** 🚧
- [ ] Advanced analytics
- [ ] Real-time notifications
- [ ] File management system
- [ ] Payment integration

### **Phase 3** 📋
- [ ] AI-powered features
- [ ] Mobile API optimization
- [ ] Advanced reporting
- [ ] Performance monitoring

---

**Made with ❤️ by LMS Development Team**
