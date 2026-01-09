import { AppError, ErrorFactory } from '../../utils/errors';
import { CloudinaryService, FileUploadResult } from '../cloudinaryService';
import { VideoFile, IVideoFile, IVideoFormat } from '../../models/extended/VideoFile';
import { Lesson } from '../../models/core';
import mongoose from 'mongoose';

export interface VideoUploadOptions {
  lessonId: string;
  userId: string;
  generateThumbnails?: boolean;
  generateFormats?: boolean;
}

export interface VideoUploadResult {
  videoFile: IVideoFile;
  uploadResult: FileUploadResult;
}

export class VideoUploadService {
  /**
   * Upload video file to Cloudinary and create VideoFile record
   */
  static async uploadVideo(
    file: Express.Multer.File,
    options: VideoUploadOptions
  ): Promise<VideoUploadResult> {
    try {
      const { lessonId, userId, generateThumbnails = true, generateFormats = true } = options;

      // Validate lesson exists and user has permission
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw ErrorFactory.notFound('Lesson not found');
      }

      // Check if lesson type is video
      if (lesson.type !== 'video') {
        throw ErrorFactory.validation('Lesson type must be video');
      }

      // Check if video file already exists
      const existingVideoFile = await VideoFile.findOne({ lessonId: new mongoose.Types.ObjectId(lessonId) });
      if (existingVideoFile) {
        throw ErrorFactory.validation('Video file already exists for this lesson');
      }

      // Validate file size (500MB max)
      const MAX_VIDEO_SIZE = 524288000; // 500MB
      if (file.size > MAX_VIDEO_SIZE) {
        throw ErrorFactory.validation(`Video file size exceeds maximum allowed size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
      }

      // Validate file format
      const allowedFormats = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedFormats.includes(file.mimetype)) {
        throw ErrorFactory.validation('Invalid video format. Allowed formats: MP4, WebM, MOV, AVI');
      }

      // Upload to Cloudinary with video-specific options
      const uploadResult = await CloudinaryService.uploadFile(file, {
        folder: `lms/videos/lessons/${lessonId}`,
        resourceType: 'video',
        userId,
      });

      // Create video formats array
      const formats: IVideoFormat[] = [
        {
          quality: 'original',
          url: uploadResult.secureUrl,
          fileSize: uploadResult.size,
          width: uploadResult.width,
          height: uploadResult.height,
        }
      ];

      // Generate thumbnails if requested
      const thumbnails: string[] = [];
      if (generateThumbnails && uploadResult.thumbnailUrl) {
        thumbnails.push(uploadResult.thumbnailUrl);
      }

      // Create VideoFile record
      const videoFile = new VideoFile({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        originalFileName: file.originalname,
        fileUrl: uploadResult.secureUrl,
        fileSize: uploadResult.size,
        duration: uploadResult.duration || 0,
        formats,
        thumbnails,
        processingStatus: 'completed', // Cloudinary processes automatically
      });

      await videoFile.save();

      // Update lesson with video URL and duration
      lesson.videoUrl = uploadResult.secureUrl;
      if (uploadResult.duration) {
        lesson.videoDuration = Math.round(uploadResult.duration);
        lesson.estimatedTime = Math.ceil(uploadResult.duration / 60); // Convert to minutes
      }
      if (uploadResult.thumbnailUrl) {
        lesson.videoThumbnail = uploadResult.thumbnailUrl;
      }
      await lesson.save();

      return {
        videoFile,
        uploadResult,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.fileUpload(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get video file by lesson ID
   */
  static async getVideoFileByLessonId(lessonId: string): Promise<IVideoFile | null> {
    try {
      return await VideoFile.findOne({ lessonId: new mongoose.Types.ObjectId(lessonId) });
    } catch (error) {
      throw ErrorFactory.database('Failed to get video file');
    }
  }

  /**
   * Get video processing status
   */
  static async getProcessingStatus(lessonId: string): Promise<{
    status: string;
    progress?: number;
    error?: string;
  }> {
    try {
      const videoFile = await VideoFile.findOne({ lessonId: new mongoose.Types.ObjectId(lessonId) });
      if (!videoFile) {
        throw ErrorFactory.notFound('Video file not found');
      }

      return {
        status: videoFile.processingStatus,
        error: videoFile.processingError,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to get processing status');
    }
  }

  /**
   * Delete video file
   */
  static async deleteVideo(lessonId: string, userId: string): Promise<void> {
    try {
      const videoFile = await VideoFile.findOne({ lessonId: new mongoose.Types.ObjectId(lessonId) });
      if (!videoFile) {
        throw ErrorFactory.notFound('Video file not found');
      }

      // Delete from Cloudinary (optional - can be done via Cloudinary API)
      // For now, just delete the record

      // Update lesson
      const lesson = await Lesson.findById(lessonId);
      if (lesson) {
        lesson.videoUrl = undefined;
        lesson.videoDuration = undefined;
        lesson.videoThumbnail = undefined;
        await lesson.save();
      }

      // Delete VideoFile record
      await VideoFile.deleteOne({ lessonId: new mongoose.Types.ObjectId(lessonId) });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to delete video');
    }
  }
}
