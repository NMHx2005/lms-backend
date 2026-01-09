import { AppError, ErrorFactory } from '../../utils/errors';
import { VideoAnalytics, IVideoAnalytics, IWatchEvent } from '../../models/extended/VideoAnalytics';
import { Lesson } from '../../models/core';
import mongoose from 'mongoose';

export interface WatchEventData {
  timestamp: number; // video timestamp in seconds
  action: 'play' | 'pause' | 'seek' | 'complete' | 'exit';
  timeSpent?: number; // seconds
}

export interface AnalyticsSummary {
  totalWatchTime: number;
  completionRate: number;
  totalEvents: number;
  averageWatchTime: number;
  dropOffPoints: number[];
  heatmap: Array<{ timestamp: number; watchCount: number }>;
}

export class VideoAnalyticsService {
  /**
   * Record a watch event
   */
  static async recordEvent(
    lessonId: string,
    studentId: string,
    eventData: WatchEventData
  ): Promise<IVideoAnalytics> {
    try {
      // Find or create analytics record
      let analytics = await VideoAnalytics.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });

      const watchEvent: IWatchEvent = {
        timestamp: eventData.timestamp,
        action: eventData.action,
        timeSpent: eventData.timeSpent || 0,
        createdAt: new Date(),
      };

      if (!analytics) {
        // Create new analytics record
        analytics = new VideoAnalytics({
          lessonId: new mongoose.Types.ObjectId(lessonId),
          studentId: new mongoose.Types.ObjectId(studentId),
          watchEvents: [watchEvent],
          totalWatchTime: eventData.timeSpent || 0,
          completionRate: 0,
        });
      } else {
        // Add event to existing record
        analytics.watchEvents.push(watchEvent);
        analytics.totalWatchTime += eventData.timeSpent || 0;
      }

      // Update completion rate if completed
      if (eventData.action === 'complete') {
        analytics.completionRate = 100;
      } else {
        // Calculate completion rate based on max timestamp
        const lesson = await Lesson.findById(lessonId);
        if (lesson && lesson.videoDuration) {
          analytics.completionRate = Math.min(
            100,
            Math.round((eventData.timestamp / lesson.videoDuration) * 100)
          );
        }
      }

      analytics.lastUpdated = new Date();
      await analytics.save();

      return analytics;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to record watch event');
    }
  }

  /**
   * Get analytics for a specific lesson and student
   */
  static async getStudentAnalytics(
    lessonId: string,
    studentId: string
  ): Promise<IVideoAnalytics | null> {
    try {
      return await VideoAnalytics.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(studentId),
      });
    } catch (error) {
      throw ErrorFactory.database('Failed to get student analytics');
    }
  }

  /**
   * Get aggregated analytics for a lesson (teacher view)
   */
  static async getLessonAnalytics(lessonId: string): Promise<AnalyticsSummary> {
    try {
      const allAnalytics = await VideoAnalytics.find({
        lessonId: new mongoose.Types.ObjectId(lessonId),
      });

      if (allAnalytics.length === 0) {
        return {
          totalWatchTime: 0,
          completionRate: 0,
          totalEvents: 0,
          averageWatchTime: 0,
          dropOffPoints: [],
          heatmap: [],
        };
      }

      // Calculate aggregated metrics
      const totalWatchTime = allAnalytics.reduce((sum, a) => sum + a.totalWatchTime, 0);
      const averageWatchTime = totalWatchTime / allAnalytics.length;
      const completionRate = allAnalytics.reduce((sum, a) => sum + a.completionRate, 0) / allAnalytics.length;
      const totalEvents = allAnalytics.reduce((sum, a) => sum + a.watchEvents.length, 0);

      // Find drop-off points (where students exit)
      const exitEvents = allAnalytics
        .flatMap(a => a.watchEvents.filter(e => e.action === 'exit'))
        .map(e => e.timestamp);
      const dropOffPoints = this.calculateDropOffPoints(exitEvents);

      // Generate heatmap (watch count per timestamp)
      const heatmap = this.generateHeatmap(allAnalytics);

      return {
        totalWatchTime,
        completionRate: Math.round(completionRate),
        totalEvents,
        averageWatchTime: Math.round(averageWatchTime),
        dropOffPoints,
        heatmap,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to get lesson analytics');
    }
  }

  /**
   * Get analytics for all lessons in a course (teacher view)
   */
  static async getCourseAnalytics(courseId: string): Promise<{
    lessonId: string;
    analytics: AnalyticsSummary;
  }[]> {
    try {
      // Get all lessons in the course
      const lessons = await Lesson.find({ courseId: new mongoose.Types.ObjectId(courseId) });
      const lessonIds = lessons.map(l => l._id.toString());

      // Get analytics for each lesson
      const analyticsPromises = lessonIds.map(async (lessonId) => {
        const analytics = await this.getLessonAnalytics(lessonId);
        return {
          lessonId,
          analytics,
        };
      });

      return await Promise.all(analyticsPromises);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorFactory.database('Failed to get course analytics');
    }
  }

  /**
   * Calculate drop-off points (timestamps where many students exit)
   */
  private static calculateDropOffPoints(exitTimestamps: number[]): number[] {
    if (exitTimestamps.length === 0) return [];

    // Group timestamps into buckets (10-second intervals)
    const buckets: { [key: number]: number } = {};
    exitTimestamps.forEach(timestamp => {
      const bucket = Math.floor(timestamp / 10) * 10;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });

    // Find buckets with high exit count (above average)
    const avgCount = exitTimestamps.length / Object.keys(buckets).length;
    const threshold = avgCount * 1.5; // 50% above average

    return Object.entries(buckets)
      .filter(([_, count]) => count >= threshold)
      .map(([timestamp]) => parseInt(timestamp))
      .sort((a, b) => a - b);
  }

  /**
   * Generate heatmap data (watch count per timestamp)
   */
  private static generateHeatmap(analytics: IVideoAnalytics[]): Array<{ timestamp: number; watchCount: number }> {
    const heatmap: { [timestamp: number]: number } = {};

    analytics.forEach(a => {
      a.watchEvents.forEach(event => {
        // Round to 5-second intervals
        const bucket = Math.floor(event.timestamp / 5) * 5;
        heatmap[bucket] = (heatmap[bucket] || 0) + 1;
      });
    });

    return Object.entries(heatmap)
      .map(([timestamp, watchCount]) => ({
        timestamp: parseInt(timestamp),
        watchCount,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}
