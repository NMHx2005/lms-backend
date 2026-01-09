import { AppError, ErrorFactory } from '../../utils/errors';
import { VideoSubtitle, IVideoSubtitle } from '../../models/extended/VideoSubtitle';
import { Lesson } from '../../models/core';
import { CloudinaryService, FileUploadResult } from '../cloudinaryService';
import mongoose from 'mongoose';

export interface CreateSubtitleData {
  language: string; // 'vi', 'en', 'zh', etc.
  file: Express.Multer.File;
}

export class SubtitleService {
  /**
   * Upload subtitle file (.srt or .vtt)
   */
  static async uploadSubtitle(
    lessonId: string,
    userId: string,
    data: CreateSubtitleData
  ): Promise<IVideoSubtitle> {
    try {
      // Validate lesson exists
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw ErrorFactory.notFound('Lesson not found');
      }

      // Validate file type
      const allowedTypes = ['text/srt', 'text/vtt', 'application/x-subrip', 'text/vtt'];
      const allowedExtensions = ['.srt', '.vtt'];
      const fileExtension = data.file.originalname.toLowerCase().substring(
        data.file.originalname.lastIndexOf('.')
      );

      if (!allowedExtensions.includes(fileExtension) && 
          !allowedTypes.includes(data.file.mimetype)) {
        throw ErrorFactory.validation('Invalid subtitle file format. Allowed formats: .srt, .vtt');
      }

      // Check if subtitle for this language already exists
      const existingSubtitle = await VideoSubtitle.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        language: data.language,
      });

      if (existingSubtitle) {
        throw ErrorFactory.validation(`Subtitle for language '${data.language}' already exists`);
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadFile(data.file, {
        folder: `lms/subtitles/lessons/${lessonId}`,
        resourceType: 'raw',
        userId,
      });

      // Create subtitle record
      const subtitle = new VideoSubtitle({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        language: data.language,
        fileUrl: uploadResult.secureUrl,
        fileName: data.file.originalname,
        fileSize: uploadResult.size,
      });

      await subtitle.save();
      return subtitle;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.fileUpload(`Failed to upload subtitle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all subtitles for a lesson
   */
  static async getSubtitles(lessonId: string): Promise<IVideoSubtitle[]> {
    try {
      return await VideoSubtitle.find({
        lessonId: new mongoose.Types.ObjectId(lessonId),
      }).sort({ language: 1 });
    } catch (error) {
      throw ErrorFactory.database('Failed to get subtitles');
    }
  }

  /**
   * Get subtitle by language
   */
  static async getSubtitleByLanguage(
    lessonId: string,
    language: string
  ): Promise<IVideoSubtitle | null> {
    try {
      return await VideoSubtitle.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        language,
      });
    } catch (error) {
      throw ErrorFactory.database('Failed to get subtitle');
    }
  }

  /**
   * Delete subtitle
   */
  static async deleteSubtitle(
    subtitleId: string,
    userId: string
  ): Promise<void> {
    try {
      const subtitle = await VideoSubtitle.findById(subtitleId);
      if (!subtitle) {
        throw ErrorFactory.notFound('Subtitle not found');
      }

      // Delete from Cloudinary (optional)
      // For now, just delete the record

      await VideoSubtitle.deleteOne({ _id: subtitleId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to delete subtitle');
    }
  }

  /**
   * Update subtitle language
   */
  static async updateSubtitleLanguage(
    subtitleId: string,
    language: string
  ): Promise<IVideoSubtitle> {
    try {
      const subtitle = await VideoSubtitle.findById(subtitleId);
      if (!subtitle) {
        throw ErrorFactory.notFound('Subtitle not found');
      }

      // Check if language already exists for this lesson
      const existing = await VideoSubtitle.findOne({
        lessonId: subtitle.lessonId,
        language,
        _id: { $ne: subtitleId },
      });

      if (existing) {
        throw ErrorFactory.validation(`Subtitle for language '${language}' already exists`);
      }

      subtitle.language = language;
      await subtitle.save();
      return subtitle;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to update subtitle');
    }
  }
}
