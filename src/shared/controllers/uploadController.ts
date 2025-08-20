import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorFactory } from '../utils/errors';
import CloudinaryService, { FileUploadResult, BatchUploadResult } from '../services/cloudinaryService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types/global';

// Upload controller
export class UploadController {
  // Upload single file
  static uploadSingleFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        throw ErrorFactory.fileUpload('No file provided');
      }

      const userId = req.user?.id;
      const folder = req.body.folder || 'lms/uploads';
      const publicId = req.body.publicId;
      const transformation = req.body.transformation ? JSON.parse(req.body.transformation) : undefined;

      const uploadResult = await CloudinaryService.uploadFile(req.file, {
        folder,
        publicId,
        transformation,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: uploadResult,
      });
    } catch (error) {
      throw error;
    }
  });

  // Upload multiple files
  static uploadMultipleFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw ErrorFactory.fileUpload('No files provided');
      }

      const userId = req.user?.id;
      const folder = req.body.folder || 'lms/uploads';
      const transformation = req.body.transformation ? JSON.parse(req.body.transformation) : undefined;
      const maxConcurrent = req.body.maxConcurrent ? parseInt(req.body.maxConcurrent) : 3;

      const uploadResult = await CloudinaryService.uploadMultipleFiles(files, {
        folder,
        transformation,
        userId,
        maxConcurrent,
      });

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadResult,
      });
    } catch (error) {
      throw error;
    }
  });

  // Upload profile picture
  static uploadProfilePicture = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        throw ErrorFactory.fileUpload('No profile picture provided');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw ErrorFactory.authentication('User not authenticated');
      }

      const uploadResult = await CloudinaryService.uploadFile(req.file, {
        folder: 'lms/profile-pictures',
        publicId: `profile_${userId}`,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: uploadResult,
      });
    } catch (error) {
      throw error;
    }
  });

  // Upload course thumbnail
  static uploadCourseThumbnail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        throw ErrorFactory.fileUpload('No course thumbnail provided');
      }

      const courseId = req.body.courseId;
      if (!courseId) {
        throw ErrorFactory.validation('Course ID is required');
      }

      const userId = req.user?.id;
      const uploadResult = await CloudinaryService.uploadFile(req.file, {
        folder: 'lms/course-thumbnails',
        publicId: `course_${courseId}_thumb`,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Course thumbnail uploaded successfully',
        data: uploadResult,
      });
    } catch (error) {
      throw error;
    }
  });

  // Upload course materials
  static uploadCourseMaterials = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw ErrorFactory.fileUpload('No course materials provided');
      }

      const courseId = req.body.courseId;
      if (!courseId) {
        throw ErrorFactory.validation('Course ID is required');
      }

      const userId = req.user?.id;
      const uploadResult = await CloudinaryService.uploadMultipleFiles(files, {
        folder: `lms/course-materials/${courseId}`,
        userId,
        maxConcurrent: 5,
      });

      res.status(200).json({
        success: true,
        message: 'Course materials uploaded successfully',
        data: uploadResult,
      });
    } catch (error) {
      throw error;
    }
  });

  // Upload lesson content
  static uploadLessonContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw ErrorFactory.fileUpload('No lesson content provided');
      }

      const lessonId = req.body.lessonId;
      if (!lessonId) {
        throw ErrorFactory.validation('Lesson ID is required');
      }

      const userId = req.user?.id;
      const uploadResult = await CloudinaryService.uploadMultipleFiles(files, {
        folder: `lms/lesson-content/${lessonId}`,
        userId,
        maxConcurrent: 3,
      });

      res.status(200).json({
        success: true,
        message: 'Lesson content uploaded successfully',
        data: uploadResult,
      });
    } catch (error) {
      throw error;
    }
  });

  // Delete file
  static deleteFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { publicId, resourceType = 'image' } = req.body;

      if (!publicId) {
        throw ErrorFactory.validation('Public ID is required');
      }

      const deleted = await CloudinaryService.deleteFile(publicId, resourceType as 'image' | 'video' | 'raw');

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'File deleted successfully',
          data: { publicId, resourceType },
        });
      } else {
        throw ErrorFactory.fileUpload('Failed to delete file');
      }
    } catch (error) {
      throw error;
    }
  });

  // Delete multiple files
  static deleteMultipleFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { files } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        throw ErrorFactory.validation('Files array is required');
      }

      const deleteResult = await CloudinaryService.deleteMultipleFiles(files);

      res.status(200).json({
        success: true,
        message: 'Files deletion completed',
        data: deleteResult,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get file information
  static getFileInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { publicId, resourceType = 'image' } = req.params;

      if (!publicId) {
        throw ErrorFactory.validation('Public ID is required');
      }

      const fileInfo = await CloudinaryService.getFileInfo(publicId, resourceType as 'image' | 'video' | 'raw');

      res.status(200).json({
        success: true,
        message: 'File information retrieved successfully',
        data: fileInfo,
      });
    } catch (error) {
      throw error;
    }
  });

  // Generate signed upload URL
  static generateSignedUploadUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { folder = 'lms/uploads', resourceType = 'image', transformation = [] } = req.body;

      const signedUrl = CloudinaryService.generateSignedUploadUrl({
        folder,
        resourceType: resourceType as 'image' | 'video' | 'raw',
        transformation,
      });

      res.status(200).json({
        success: true,
        message: 'Signed upload URL generated successfully',
        data: { signedUrl, folder, resourceType },
      });
    } catch (error) {
      throw error;
    }
  });

  // Get optimized image URL
  static getOptimizedImageUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { publicId } = req.params;
      const { width, height, quality = 'auto:good', format = 'auto', crop = 'limit' } = req.query;

      if (!publicId) {
        throw ErrorFactory.validation('Public ID is required');
      }

      const optimizedUrl = CloudinaryService.getOptimizedImageUrl(publicId, {
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        quality: quality as string,
        format: format as string,
        crop: crop as string,
      });

      res.status(200).json({
        success: true,
        message: 'Optimized image URL generated successfully',
        data: { 
          originalPublicId: publicId,
          optimizedUrl,
          options: { width, height, quality, format, crop }
        },
      });
    } catch (error) {
      throw error;
    }
  });

  // Get video thumbnail URL
  static getVideoThumbnailUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { publicId } = req.params;
      const { width = 300, height = 200, quality = 'auto:good', format = 'jpg', time = '00:00:01' } = req.query;

      if (!publicId) {
        throw ErrorFactory.validation('Public ID is required');
      }

      const thumbnailUrl = CloudinaryService.getVideoThumbnailUrl(publicId, {
        width: parseInt(width as string),
        height: parseInt(height as string),
        quality: quality as string,
        format: format as string,
        time: time as string,
      });

      res.status(200).json({
        success: true,
        message: 'Video thumbnail URL generated successfully',
        data: { 
          originalPublicId: publicId,
          thumbnailUrl,
          options: { width, height, quality, format, time }
        },
      });
    } catch (error) {
      throw error;
    }
  });

  // Health check for upload service
  static healthCheck = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Test Cloudinary connection by getting account info
      const accountInfo = await CloudinaryService.getFileInfo('test', 'image').catch(() => null);
      
      const status = {
        service: 'File Upload Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cloudinary: accountInfo ? 'connected' : 'disconnected',
        features: {
          singleUpload: true,
          multipleUpload: true,
          fileDeletion: true,
          optimization: true,
          signedUrls: true,
        },
      };

      res.status(200).json({
        success: true,
        message: 'Upload service health check completed',
        data: status,
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Upload service health check failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
}

export default UploadController;
