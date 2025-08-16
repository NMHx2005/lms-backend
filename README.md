# 🎓 LMS Backend

Backend API cho hệ thống Learning Management System (LMS) được xây dựng với Node.js, Express, TypeScript và MongoDB.

## 🚀 **PHASE 1: Setup & Infrastructure - HOÀN THÀNH 100%** ✅

### ✅ **Đã hoàn thành:**

#### 1. **Project Setup**
- [x] Package.json với scripts
- [x] TypeScript configuration
- [x] ESLint & Prettier setup
- [x] Environment variables template

#### 2. **Database Models**
- [x] User Model (admin, teacher, student roles)
- [x] Course Model (with validation, indexes, virtuals)
- [x] Section Model (course structure)
- [x] Lesson Model (content management)
- [x] Assignment Model (quiz, file, text types)
- [x] Submission Model (student work)
- [x] Enrollment Model (student progress)
- [x] Bill Model (payment tracking)
- [x] RefundRequest Model (refund management)
- [x] CourseRating Model (upvotes & reports)

#### 3. **Database Connection**
- [x] MongoDB connection với Mongoose
- [x] Connection pooling & error handling
- [x] Connection events & graceful shutdown
- [x] Health check functions

#### 4. **Database Seeding**
- [x] Sample data cho tất cả models
- [x] Admin, teacher, student users
- [x] Sample courses, sections, lessons
- [x] Sample assignments, enrollments, bills

#### 5. **Infrastructure**
- [x] Custom error classes
- [x] Health check endpoints
- [x] Global type definitions
- [x] Path aliases configuration

## 🛠️ **Tech Stack**

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT (planned)
- **File Upload**: Multer + Cloudinary (planned)
- **Payment**: Stripe (planned)
- **Email**: SendGrid (planned)
- **AI**: OpenAI (planned)

## 📁 **Project Structure**

```
lms-backend/
├── src/
│   ├── config/          # Database, Cloudinary config
│   ├── models/          # MongoDB schemas & models
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation middleware
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── scripts/         # Database seeding & utilities
├── .env.example         # Environment variables template
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies & scripts
```

## 🚀 **Quick Start**

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# ... other variables
```

### 3. **Database Setup**
```bash
# Seed database with sample data
npm run seed

# Check database status
npm run db:status
```

### 4. **Development**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📋 **Available Scripts**

```bash
npm run dev              # Start development server
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production server
npm run seed             # Seed database with sample data
npm run db:status        # Check database connection
npm run test:cors        # Test CORS configuration
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types
```

## 🔒 **CORS Configuration**

### CORS Setup
- **Development**: Allows all origins when `CORS_ORIGIN` is not set
- **Production**: Requires `CORS_ORIGIN` to be configured
- **Multiple Origins**: Support for comma-separated origins
- **Wildcard Subdomains**: Support for `*.yourdomain.com` patterns

### Environment Variables
```bash
# Multiple origins separated by commas
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Wildcard subdomains
CORS_ORIGIN=*.yourdomain.com

# Production example
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Test CORS Configuration
```bash
npm run test:cors
```

## 🔍 **API Endpoints**

### Health Check
- `GET /health` - System health status
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe

### Authentication (Planned)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Users (Planned)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/admin/users` - Admin: list all users

### Courses (Planned)
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

## 🗄️ **Database Schema**

### Core Entities
- **Users**: Admin, Teacher, Student roles
- **Courses**: Course content & metadata
- **Sections**: Course structure organization
- **Lessons**: Individual learning units
- **Assignments**: Tasks & assessments
- **Submissions**: Student work submissions
- **Enrollments**: Student course progress
- **Bills**: Payment tracking
- **RefundRequests**: Refund management
- **CourseRatings**: Course feedback & reports

### Key Features
- Role-based access control
- Course approval workflow
- Progress tracking
- Payment integration ready
- File upload support
- Search & filtering
- Pagination support

## 🔧 **Development Tools**

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type safety

### Database Tools
- **Mongoose**: MongoDB ODM
- **Database Seeding**: Sample data generation
- **Health Checks**: Connection monitoring

## 📊 **Current Status**

- ✅ **Phase 1**: Setup & Infrastructure - **100% Complete**
- 🔄 **Phase 2**: Core Middleware & Utilities - **Next**
- ⏳ **Phase 3**: Core Controllers & Services
- ⏳ **Phase 4**: API Routes & Endpoints
- ⏳ **Phase 5**: Payment & Billing System
- ⏳ **Phase 6**: Analytics & Reporting
- ⏳ **Phase 7**: Notification & Communication
- ⏳ **Phase 8**: Testing & Quality Assurance
- ⏳ **Phase 9**: Deployment & DevOps
- ⏳ **Phase 10**: Documentation & Maintenance

## 🎯 **Next Steps**

1. **Phase 2**: Implement authentication middleware, validation, error handling
2. **Phase 3**: Create controllers và services cho core functionality
3. **Phase 4**: Build API endpoints và integrate với frontend

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

For support, email support@lms.com or create an issue in this repository.

---

**🎉 Phase 1 hoàn thành! Backend infrastructure đã sẵn sàng cho development tiếp theo.**
