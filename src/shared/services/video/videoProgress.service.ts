import { AppError, ErrorFactory } from '../../utils/errors';
import { VideoProgress, IVideoProgress } from '../../models/extended/VideoProgress';
import { Lesson } from '../../models/core';
import mongoose from 'mongoose';

export interface ProgressUpdateData {
  currentTime: number; // seconds
  progress?: number; // 0-100 (optional, will be calculated)
  watchTime?: number; // total seconds watched
}

export interface ProgressResult {
  progress: IVideoProgress;
  isCompleted: boolean;
  shouldMarkCompleted: boolean;
}

export class VideoProgressService {
  // Completion threshold (80% watched)
  private static readonly COMPLETION_THRESHOLD = 80;

  /**
   * Save or update video progress
   */
  static async saveProgress(
    lessonId: string,
    studentId: string,
    data: ProgressUpdateData
  ): Promise<ProgressResult> {
    try {
      // Validate lesson exists
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        throw ErrorFactory.notFound('Lesson not found');
      }

      // Calculate progress if not provided
      let progress = data.progress;
      if (progress === undefined && lesson.videoDuration) {
        progress = Math.min(100, Math.round((data.currentTime / lesson.videoDuration) * 100));
      }

      // Find or create progress record
      let videoProgress = await VideoProgress.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });

      if (!videoProgress) {
        videoProgress = new VideoProgress({
          lessonId: new mongoose.Types.ObjectId(lessonId),
          studentId: new mongoose.Types.ObjectId(studentId),
          currentTime: data.currentTime,
          progress: progress || 0,
          watchTime: data.watchTime || 0,
          completed: false,
        });
      } else {
        // Update existing progress
        videoProgress.currentTime = data.currentTime;
        if (progress !== undefined) {
          videoProgress.progress = progress;
        }
        if (data.watchTime !== undefined) {
          videoProgress.watchTime = data.watchTime;
        }
        videoProgress.lastWatchedAt = new Date();
      }

      // Check if should mark as completed
      const shouldMarkCompleted = !videoProgress.completed && 
        (progress || 0) >= this.COMPLETION_THRESHOLD;

      if (shouldMarkCompleted) {
        videoProgress.completed = true;
      }

      await videoProgress.save();

      return {
        progress: videoProgress,
        isCompleted: videoProgress.completed,
        shouldMarkCompleted,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to save video progress');
    }
  }

  /**
   * Get video progress for a student
   */
  static async getProgress(
    lessonId: string,
    studentId: string
  ): Promise<IVideoProgress | null> {
    try {
      return await VideoProgress.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });
    } catch (error) {
      throw ErrorFactory.database('Failed to get video progress');
    }
  }

  /**
   * Get all progress for a course
   */
  static async getCourseProgress(
    courseId: string,
    studentId: string
  ): Promise<IVideoProgress[]> {
    try {
      // Get all lessons in the course
      const lessons = await Lesson.find({ courseId: new mongoose.Types.ObjectId(courseId) });
      const lessonIds = lessons.map(l => l._id);

      // Get all progress for these lessons
      return await VideoProgress.find({
        lessonId: { $in: lessonIds },
        studentId: new mongoose.Types.ObjectId(studentId),
      }).populate('lessonId');
    } catch (error) {
      throw ErrorFactory.database('Failed to get course progress');
    }
  }

  /**
   * Mark lesson as completed manually
   */
  static async markCompleted(
    lessonId: string,
    studentId: string
  ): Promise<IVideoProgress> {
    try {
      let videoProgress = await VideoProgress.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });

      if (!videoProgress) {
        // Create new progress record
        videoProgress = new VideoProgress({
          lessonId: new mongoose.Types.ObjectId(lessonId),
          studentId: new mongoose.Types.ObjectId(studentId),
          currentTime: 0,
          progress: 100,
          watchTime: 0,
          completed: true,
        });
      } else {
        videoProgress.completed = true;
        videoProgress.progress = 100;
      }

      await videoProgress.save();
      return videoProgress;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to mark lesson as completed');
    }
  }

  /**
   * Reset progress (for retaking course)
   */
  static async resetProgress(
    lessonId: string,
    studentId: string
  ): Promise<void> {
    try {
      await VideoProgress.deleteOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });
    } catch (error) {
      throw ErrorFactory.database('Failed to reset progress');
    }
  }
}
