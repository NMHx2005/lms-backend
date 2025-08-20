import express from 'express';
import { authenticate, requireAdmin, requireTeacher, requireStudent } from '../middleware/auth';
import { handleMulterError, validateUploadedFiles } from '../middleware/multer';
import { multerInstances } from '../middleware/multer';
import UploadController from '../controllers/uploadController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply multer error handling middleware
router.use(handleMulterError);

// Health check
router.get('/health', UploadController.healthCheck as any);

// Single file uploads
router.post('/single/image', 
  multerInstances.singleImage.single('image'),
  UploadController.uploadSingleFile as any
);

router.post('/single/video', 
  multerInstances.singleVideo.single('video'),
  UploadController.uploadSingleFile as any
);

router.post('/single/audio', 
  multerInstances.singleAudio.single('audio'),
  UploadController.uploadSingleFile as any
);

router.post('/single/document', 
  multerInstances.singleDocument.single('document'),
  UploadController.uploadSingleFile as any
);

router.post('/single/archive', 
  multerInstances.singleArchive.single('archive'),
  UploadController.uploadSingleFile as any
);

// Multiple file uploads
router.post('/multiple/images', 
  multerInstances.multipleImages.array('images', 10),
  validateUploadedFiles(['images'], { images: 10 }),
  UploadController.uploadMultipleFiles as any
);

router.post('/multiple/videos', 
  multerInstances.multipleVideos.array('videos', 5),
  validateUploadedFiles(['videos'], { videos: 5 }),
  UploadController.uploadMultipleFiles as any
);

router.post('/multiple/audio', 
  multerInstances.multipleAudio.array('audio', 10),
  validateUploadedFiles(['audio'], { audio: 10 }),
  UploadController.uploadMultipleFiles as any
);

router.post('/multiple/documents', 
  multerInstances.multipleDocuments.array('documents', 20),
  validateUploadedFiles(['documents'], { documents: 20 }),
  UploadController.uploadMultipleFiles as any
);

router.post('/multiple/archives', 
  multerInstances.multipleArchives.array('archives', 5),
  validateUploadedFiles(['archives'], { archives: 5 }),
  UploadController.uploadMultipleFiles as any
);

// Mixed file uploads
router.post('/mixed', 
  multerInstances.mixedFiles.array('files', 20),
  validateUploadedFiles(['files'], { files: 20 }),
  UploadController.uploadMultipleFiles as any
);

// Specialized uploads
router.post('/profile-picture', 
  multerInstances.profilePictures.single('profilePicture'),
  UploadController.uploadProfilePicture as any
);

router.post('/course-thumbnail', 
  multerInstances.courseThumbnails.single('thumbnail'),
  requireTeacher,
  UploadController.uploadCourseThumbnail as any
);

router.post('/course-materials', 
  multerInstances.courseMaterials.array('materials', 50),
  requireTeacher,
  validateUploadedFiles(['materials'], { materials: 50 }),
  UploadController.uploadCourseMaterials as any
);

router.post('/lesson-content', 
  multerInstances.mixedFiles.array('content', 20),
  requireTeacher,
  validateUploadedFiles(['content'], { content: 20 }),
  UploadController.uploadLessonContent as any
);

// File management
router.delete('/file', UploadController.deleteFile as any);
router.delete('/files', UploadController.deleteMultipleFiles as any);
router.get('/file/:publicId/:resourceType?', UploadController.getFileInfo as any);

// URL generation
router.post('/signed-url', UploadController.generateSignedUploadUrl as any);
router.get('/optimize/:publicId', UploadController.getOptimizedImageUrl as any);
router.get('/thumbnail/:publicId', UploadController.getVideoThumbnailUrl as any);

// Admin-only routes
router.post('/admin/bulk-upload', 
  multerInstances.mixedFiles.array('files', 100),
  requireAdmin,
  validateUploadedFiles(['files'], { files: 100 }),
  UploadController.uploadMultipleFiles as any
);

router.delete('/admin/bulk-delete', 
  requireAdmin,
  UploadController.deleteMultipleFiles as any
);

// Teacher-specific routes
router.post('/teacher/course-content', 
  multerInstances.courseMaterials.array('content', 30),
  requireTeacher,
  validateUploadedFiles(['content'], { content: 30 }),
  UploadController.uploadCourseMaterials as any
);

router.post('/teacher/lesson-materials', 
  multerInstances.mixedFiles.array('materials', 25),
  requireTeacher,
  validateUploadedFiles(['materials'], { materials: 25 }),
  UploadController.uploadLessonContent as any
);

// Student-specific routes
router.post('/student/assignment', 
  multerInstances.multipleDocuments.array('files', 5),
  requireStudent,
  validateUploadedFiles(['files'], { files: 5 }),
  UploadController.uploadMultipleFiles as any
);

router.post('/student/project', 
  multerInstances.mixedFiles.array('files', 10),
  requireStudent,
  validateUploadedFiles(['files'], { files: 10 }),
  UploadController.uploadMultipleFiles as any
);

export default router;
