import express from 'express';
import { authenticate, requireAdmin, requireTeacher, requireStudent } from '../../admin/middleware/auth';
import { handleMulterError, validateUploadedFiles } from '../middleware/multer';
import { multerInstances } from '../middleware/multer';
import UploadController from '../controllers/uploadController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply multer error handling middleware
router.use(handleMulterError);

// Health check
router.get('/health', UploadController.healthCheck);

// Single file uploads
router.post('/single/image', 
  multerInstances.singleImage.single('image'),
  UploadController.uploadSingleFile
);

router.post('/single/video', 
  multerInstances.singleVideo.single('video'),
  UploadController.uploadSingleFile
);

router.post('/single/audio', 
  multerInstances.singleAudio.single('audio'),
  UploadController.uploadSingleFile
);

router.post('/single/document', 
  multerInstances.singleDocument.single('document'),
  UploadController.uploadSingleFile
);

router.post('/single/archive', 
  multerInstances.singleArchive.single('archive'),
  UploadController.uploadSingleFile
);

// Multiple file uploads
router.post('/multiple/images', 
  multerInstances.multipleImages.array('images', 10),
  validateUploadedFiles(['images'], { images: 10 }),
  UploadController.uploadMultipleFiles
);

router.post('/multiple/videos', 
  multerInstances.multipleVideos.array('videos', 5),
  validateUploadedFiles(['videos'], { videos: 5 }),
  UploadController.uploadMultipleFiles
);

router.post('/multiple/audio', 
  multerInstances.multipleAudio.array('audio', 10),
  validateUploadedFiles(['audio'], { audio: 10 }),
  UploadController.uploadMultipleFiles
);

router.post('/multiple/documents', 
  multerInstances.multipleDocuments.array('documents', 20),
  validateUploadedFiles(['documents'], { documents: 20 }),
  UploadController.uploadMultipleFiles
);

router.post('/multiple/archives', 
  multerInstances.multipleArchives.array('archives', 5),
  validateUploadedFiles(['archives'], { archives: 5 }),
  UploadController.uploadMultipleFiles
);

// Mixed file uploads
router.post('/mixed', 
  multerInstances.mixedFiles.array('files', 20),
  validateUploadedFiles(['files'], { files: 20 }),
  UploadController.uploadMultipleFiles
);

// Specialized uploads
router.post('/profile-picture', 
  multerInstances.profilePictures.single('profilePicture'),
  UploadController.uploadProfilePicture
);

router.post('/course-thumbnail', 
  multerInstances.courseThumbnails.single('thumbnail'),
  requireTeacher,
  UploadController.uploadCourseThumbnail
);

router.post('/course-materials', 
  multerInstances.courseMaterials.array('materials', 50),
  requireTeacher,
  validateUploadedFiles(['materials'], { materials: 50 }),
  UploadController.uploadCourseMaterials
);

router.post('/lesson-content', 
  multerInstances.mixedFiles.array('content', 20),
  requireTeacher,
  validateUploadedFiles(['content'], { content: 20 }),
  UploadController.uploadLessonContent
);

// File management
router.delete('/file', UploadController.deleteFile);
router.delete('/files', UploadController.deleteMultipleFiles);
router.get('/file/:publicId/:resourceType?', UploadController.getFileInfo);

// URL generation
router.post('/signed-url', UploadController.generateSignedUploadUrl);
router.get('/optimize/:publicId', UploadController.getOptimizedImageUrl);
router.get('/thumbnail/:publicId', UploadController.getVideoThumbnailUrl);

// Admin-only routes
router.post('/admin/bulk-upload', 
  multerInstances.mixedFiles.array('files', 100),
  requireAdmin,
  validateUploadedFiles(['files'], { files: 100 }),
  UploadController.uploadMultipleFiles
);

router.delete('/admin/bulk-delete', 
  requireAdmin,
  UploadController.deleteMultipleFiles
);

// Teacher-specific routes
router.post('/teacher/course-content', 
  multerInstances.courseMaterials.array('content', 30),
  requireTeacher,
  validateUploadedFiles(['content'], { content: 30 }),
  UploadController.uploadCourseMaterials
);

router.post('/teacher/lesson-materials', 
  multerInstances.mixedFiles.array('materials', 25),
  requireTeacher,
  validateUploadedFiles(['materials'], { materials: 25 }),
  UploadController.uploadLessonContent
);

// Student-specific routes
router.post('/student/assignment', 
  multerInstances.multipleDocuments.array('files', 5),
  requireStudent,
  validateUploadedFiles(['files'], { files: 5 }),
  UploadController.uploadMultipleFiles
);

router.post('/student/project', 
  multerInstances.mixedFiles.array('files', 10),
  requireStudent,
  validateUploadedFiles(['files'], { files: 10 }),
  UploadController.uploadMultipleFiles
);

export default router;
