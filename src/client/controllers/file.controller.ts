import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import CloudinaryService from '../../shared/services/cloudinaryService';
import Lesson from '../../shared/models/core/Lesson';
import { ErrorFactory } from '../../shared/utils/errors';
import { multerInstances } from '../../shared/middleware/multer';

export class FileController {
  /**
   * Upload file(s) for a lesson
   * POST /api/client/lessons/:lessonId/files
   */
  static uploadFiles = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];
    const folder = req.body.folder || `lms/lessons/${lessonId}/files`;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided',
      });
    }

    // Verify lesson exists and user has permission
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
    }

    // Check if user is the course instructor
    const Course = (await import('../../shared/models/core/Course')).default;
    const course = await Course.findById(lesson.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to upload files for this lesson',
      });
    }

    // Upload files to Cloudinary
    const uploadResults = await CloudinaryService.uploadMultipleFiles(files, {
      folder,
      userId,
      maxConcurrent: 3,
    });

    // Check if any files failed to upload
    if (uploadResults.failed.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Failed to upload ${uploadResults.failureCount} file(s)`,
        data: {
          successful: uploadResults.successful,
          failed: uploadResults.failed,
        },
      });
    }

    // Update lesson with file information
    // For single file, update fileUrl, fileSize, fileType
    // For multiple files, add to attachments array
    const successfulUploads = uploadResults.successful;
    if (successfulUploads.length === 1) {
      const result = successfulUploads[0];
      lesson.fileUrl = result.secureUrl;
      lesson.fileSize = result.size;
      lesson.fileType = result.mimeType;
    } else if (successfulUploads.length > 1) {
      // Multiple files - add to attachments
      const attachments = successfulUploads.map((result: any) => ({
        name: result.originalName,
        url: result.secureUrl,
        size: result.size,
        type: result.mimeType,
      }));

      // Merge with existing attachments
      lesson.attachments = [...(lesson.attachments || []), ...attachments];
    }

    await lesson.save();

    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: successfulUploads,
        lesson: {
          fileUrl: lesson.fileUrl,
          fileSize: lesson.fileSize,
          fileType: lesson.fileType,
          attachments: lesson.attachments,
        },
      },
    });
  });

  /**
   * Delete file from lesson
   * DELETE /api/client/lessons/:lessonId/files/:fileId
   */
  static deleteFile = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId, fileId } = req.params;
    const userId = req.user!.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
    }

    // Check permission
    const Course = (await import('../../shared/models/core/Course')).default;
    const course = await Course.findById(lesson.courseId);
    if (!course || course.instructorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete files from this lesson',
      });
    }

    // If fileId is 'main', delete the main fileUrl
    if (fileId === 'main') {
      lesson.fileUrl = undefined;
      lesson.fileSize = undefined;
      lesson.fileType = undefined;
    } else {
      // Remove from attachments
      if (lesson.attachments && lesson.attachments.length > 0) {
        lesson.attachments = lesson.attachments.filter(
          (att, index) => index.toString() !== fileId
        );
      }
    }

    await lesson.save();

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  });

  /**
   * Get lesson files
   * GET /api/client/lessons/:lessonId/files
   */
  static getFiles = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId).select('fileUrl fileSize fileType attachments');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found',
      });
    }

    const files: any[] = [];

    // Add main file if exists
    if (lesson.fileUrl) {
      files.push({
        id: 'main',
        name: lesson.fileUrl.split('/').pop() || 'File',
        url: lesson.fileUrl,
        size: lesson.fileSize,
        type: lesson.fileType,
        isMain: true,
      });
    }

    // Add attachments
    if (lesson.attachments && lesson.attachments.length > 0) {
      lesson.attachments.forEach((att, index) => {
        files.push({
          id: index.toString(),
          name: att.name,
          url: att.url,
          size: att.size,
          type: att.type,
          isMain: false,
        });
      });
    }

    res.json({
      success: true,
      data: files,
    });
  });
}
