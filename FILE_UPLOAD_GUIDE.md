# 📁 **LMS Backend File Upload System Guide**

## 📋 **Tổng quan**

Hệ thống file upload được xây dựng với Multer và Cloudinary để:
- ✅ **Hỗ trợ nhiều loại file**: Images, Videos, Audio, Documents, Archives
- ✅ **Tích hợp Cloudinary**: Upload, optimization, transformation
- ✅ **Validation mạnh mẽ**: File type, size, format validation
- ✅ **Role-based access**: Phân quyền theo vai trò người dùng
- ✅ **Error handling**: Xử lý lỗi chi tiết và nhất quán
- ✅ **Batch processing**: Upload nhiều file cùng lúc

## 🏗️ **Cấu trúc hệ thống**

### **1. Configuration Files**
```
src/shared/config/
├── cloudinary.ts          # Cloudinary configuration
└── database.ts            # Database configuration
```

### **2. Middleware**
```
src/shared/middleware/
├── multer.ts              # Multer configuration & instances
├── auth.ts                # Authentication & authorization
└── errorHandler.ts        # Error handling
```

### **3. Services**
```
src/shared/services/
└── cloudinaryService.ts   # Cloudinary upload logic
```

### **4. Controllers**
```
src/shared/controllers/
└── uploadController.ts     # Upload endpoints logic
```

### **5. Routes**
```
src/shared/routes/
├── upload.routes.ts       # Upload API endpoints
└── index.ts               # Route exports
```

## 🔧 **Cài đặt & Configuration**

### **1. Dependencies**
```bash
npm install multer cloudinary multer-storage-cloudinary
npm install --save-dev @types/multer
```

### **2. Environment Variables**
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### **3. Cloudinary Setup**
```typescript
// src/shared/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

## 📊 **File Types & Limits**

### **Supported File Types**
| Category | Formats | Max Size | Max Files |
|----------|---------|----------|-----------|
| **Images** | JPG, PNG, GIF, WebP, SVG | 5MB | 10 |
| **Videos** | MP4, AVI, MOV, WMV, FLV, WebM | 100MB | 5 |
| **Audio** | MP3, WAV, OGG, AAC, FLAC | 20MB | 10 |
| **Documents** | PDF, DOC, DOCX, TXT, RTF | 10MB | 20 |
| **Archives** | ZIP, RAR, 7Z, TAR, GZ | 50MB | 5 |

### **Custom Configurations**
```typescript
// Profile pictures: 2MB max, single file
profilePictures: createMulterUpload('image', 1, customFilter)

// Course materials: 50MB max, 50 files
courseMaterials: createMulterUpload('mixed', 50, customFilter)

// Course thumbnails: 1MB max, single file
courseThumbnails: createMulterUpload('image', 1, customFilter)
```

## 🚀 **API Endpoints**

### **1. Single File Uploads**
```http
POST /api/upload/single/image
POST /api/upload/single/video
POST /api/upload/single/audio
POST /api/upload/single/document
POST /api/upload/single/archive
```

**Request:**
```typescript
// FormData
{
  image: File,
  folder?: string,
  publicId?: string,
  transformation?: string // JSON string
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "publicId": "lms/images/123456_abc123",
    "url": "https://res.cloudinary.com/...",
    "secureUrl": "https://res.cloudinary.com/...",
    "format": "jpg",
    "resourceType": "image",
    "size": 1024000,
    "width": 1920,
    "height": 1080,
    "originalName": "photo.jpg",
    "mimeType": "image/jpeg",
    "folder": "lms/images",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **2. Multiple File Uploads**
```http
POST /api/upload/multiple/images
POST /api/upload/multiple/videos
POST /api/upload/multiple/audio
POST /api/upload/multiple/documents
POST /api/upload/multiple/archives
POST /api/upload/mixed
```

**Request:**
```typescript
// FormData
{
  images: File[],
  folder?: string,
  transformation?: string,
  maxConcurrent?: number
}
```

### **3. Specialized Uploads**
```http
POST /api/upload/profile-picture
POST /api/upload/course-thumbnail
POST /api/upload/course-materials
POST /api/upload/lesson-content
```

### **4. File Management**
```http
DELETE /api/upload/file
DELETE /api/upload/files
GET /api/upload/file/:publicId/:resourceType?
```

### **5. URL Generation**
```http
POST /api/upload/signed-url
GET /api/upload/optimize/:publicId
GET /api/upload/thumbnail/:publicId
```

### **6. Role-based Routes**
```http
# Admin routes
POST /api/upload/admin/bulk-upload
DELETE /api/upload/admin/bulk-delete

# Teacher routes
POST /api/upload/teacher/course-content
POST /api/upload/teacher/lesson-materials

# Student routes
POST /api/upload/student/assignment
POST /api/upload/student/project
```

## 🛡️ **Security & Validation**

### **1. Authentication**
```typescript
// All upload routes require authentication
router.use(authenticate);
```

### **2. Authorization**
```typescript
// Role-based permissions
requirePermission('course:create')
requirePermission('teacher:course:create')
requirePermission('student:assignment:submit')
```

### **3. File Validation**
```typescript
// File type validation
const fileFilter = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check MIME type
    // Check file extension
    // Check file size
  };
};
```

### **4. Error Handling**
```typescript
// Multer error handling
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    // Handle specific multer errors
    // Return formatted error responses
  }
};
```

## 🔄 **Cloudinary Integration**

### **1. Upload Options**
```typescript
export const CLOUDINARY_UPLOAD_OPTIONS = {
  image: {
    folder: 'lms/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image',
  },
  // ... other types
};
```

### **2. Image Optimization**
```typescript
// Generate optimized URLs
const optimizedUrl = CloudinaryService.getOptimizedImageUrl(publicId, {
  width: 800,
  height: 600,
  quality: 'auto:good',
  format: 'auto',
  crop: 'limit',
});
```

### **3. Video Thumbnails**
```typescript
// Generate video thumbnails
const thumbnailUrl = CloudinaryService.getVideoThumbnailUrl(publicId, {
  width: 300,
  height: 200,
  quality: 'auto:good',
  format: 'jpg',
  time: '00:00:01',
});
```

### **4. Signed Upload URLs**
```typescript
// Generate signed URLs for direct uploads
const signedUrl = CloudinaryService.generateSignedUploadUrl({
  folder: 'lms/uploads',
  resourceType: 'image',
  transformation: [],
  expiresIn: 3600, // 1 hour
});
```

## 📝 **Usage Examples**

### **1. Frontend Integration**
```typescript
// Upload single image
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'lms/profile-pictures');
  
  const response = await fetch('/api/upload/single/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  return response.json();
};
```

### **2. Multiple File Upload**
```typescript
// Upload multiple documents
const uploadDocuments = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('documents', file);
  });
  formData.append('folder', 'lms/course-materials/123');
  
  const response = await fetch('/api/upload/multiple/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  return response.json();
};
```

### **3. Error Handling**
```typescript
try {
  const result = await uploadImage(file);
  console.log('Upload successful:', result.data);
} catch (error) {
  if (error.response?.data?.error?.code === 'FILE_TOO_LARGE') {
    console.error('File size exceeds limit');
  } else if (error.response?.data?.error?.code === 'INVALID_FILE_TYPE') {
    console.error('File type not allowed');
  } else {
    console.error('Upload failed:', error.message);
  }
}
```

## 🧪 **Testing**

### **1. Health Check**
```http
GET /api/upload/health
```

**Response:**
```json
{
  "success": true,
  "message": "Upload service health check completed",
  "data": {
    "service": "File Upload Service",
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "cloudinary": "connected",
    "features": {
      "singleUpload": true,
      "multipleUpload": true,
      "fileDeletion": true,
      "optimization": true,
      "signedUrls": true
    }
  }
}
```

### **2. Test File Uploads**
```bash
# Test single image upload
curl -X POST http://localhost:5000/api/upload/single/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "folder=lms/test"

# Test multiple files upload
curl -X POST http://localhost:5000/api/upload/multiple/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "folder=lms/test"
```

## 🚨 **Error Handling**

### **1. Common Error Codes**
```typescript
export const ERROR_CODES = {
  FILE_UPLOAD_ERROR: '9000',
  FILE_TOO_LARGE: '9001',
  INVALID_FILE_TYPE: '9002',
  FILE_CORRUPTED: '9003',
  UPLOAD_FAILED: '9004',
};
```

### **2. Error Response Format**
```json
{
  "success": false,
  "error": {
    "message": "File type not allowed",
    "code": "9002",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/upload/single/image",
    "details": {
      "fileName": "document.txt",
      "fileType": "text/plain",
      "allowedTypes": ["image/jpeg", "image/png", "image/gif"]
    },
    "requestId": "req_123456"
  }
}
```

## 🔧 **Configuration Options**

### **1. File Size Limits**
```typescript
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  video: 100 * 1024 * 1024,    // 100MB
  audio: 20 * 1024 * 1024,     // 20MB
  document: 10 * 1024 * 1024,  // 10MB
  archive: 50 * 1024 * 1024,   // 50MB
  default: 10 * 1024 * 1024,   // 10MB
};
```

### **2. Allowed MIME Types**
```typescript
export const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  // ... other types
};
```

### **3. Cloudinary Folders**
```typescript
export const CLOUDINARY_FOLDERS = {
  PROFILE_PICTURES: 'lms/profile-pictures',
  COURSE_THUMBNAILS: 'lms/course-thumbnails',
  COURSE_MATERIALS: 'lms/course-materials',
  LESSON_CONTENT: 'lms/lesson-content',
  ASSIGNMENTS: 'lms/assignments',
  PROJECTS: 'lms/projects',
};
```

## 📚 **Best Practices**

### **1. File Organization**
- Sử dụng folder structure rõ ràng
- Đặt tên file có ý nghĩa
- Sử dụng user ID trong folder path

### **2. Security**
- Validate file types và sizes
- Implement role-based access control
- Sanitize file names
- Use secure URLs

### **3. Performance**
- Implement batch processing
- Use concurrent uploads
- Optimize images và videos
- Implement caching

### **4. Error Handling**
- Provide clear error messages
- Log errors for debugging
- Implement retry mechanisms
- Graceful degradation

## 🔮 **Future Enhancements**

### **1. Planned Features**
- [ ] **Video streaming** với HLS/DASH
- [ ] **Image editing** trực tiếp trên Cloudinary
- [ ] **AI-powered** content moderation
- [ ] **CDN integration** cho performance
- [ ] **Backup storage** với multiple providers

### **2. Scalability Improvements**
- [ ] **Queue system** cho large uploads
- [ ] **Chunked uploads** cho large files
- [ ] **Progress tracking** cho uploads
- [ ] **Resume uploads** functionality

---

## 📞 **Support**

Nếu có vấn đề gì với hệ thống file upload, vui lòng:
1. Kiểm tra logs trong console
2. Verify Cloudinary configuration
3. Check file permissions và sizes
4. Contact development team

**Happy Uploading! 🚀**
