import { Request, Response } from 'express';
import Enrollment from '../../shared/models/core/Enrollment';
import Assignment from '../../shared/models/core/Assignment';
import Course from '../../shared/models/core/Course';

export class ClientAnalyticsController {
  static async getOverview(req: Request, res: Response) {
    const studentId = (req as any).user?.id;
    const enrollments = await Enrollment.find({ studentId, isActive: true });
    const totalEnrolledCourses = enrollments.length;
    const averageProgress = totalEnrolledCourses
      ? Math.round(
          (enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / totalEnrolledCourses) * 100
        ) / 100
      : 0;
    const learningTimeMinutes = Math.round(
      enrollments.reduce((sum: number, e: any) => sum + (e.totalTimeSpent || 0), 0) / 60
    );
    // Upcoming assignments by enrolled courses (if Assignment model available)
    const courseIds = enrollments.map((e: any) => e.courseId);
    const now = new Date();
    const upcomingAssignments = await Assignment.countDocuments({ courseId: { $in: courseIds }, dueDate: { $gt: now } });

    return res.json({
      success: true,
      data: { totalEnrolledCourses, averageProgress, upcomingAssignments, learningTimeMinutes }
    });
  }

  static async getProgress(req: Request, res: Response) {
    const studentId = (req as any).user?.id;
    const enrollments = await Enrollment.find({ studentId, isActive: true }).populate('courseId', 'title');
    const progressByCourse = enrollments.map((e: any) => ({
      courseId: e.courseId?._id || e.courseId,
      courseTitle: e.courseId?.title || undefined,
      progress: e.progress || 0
    }));
    return res.json({ success: true, data: { progressByCourse } });
  }

  static async getTimeSpent(req: Request, res: Response) {
    const studentId = (req as any).user?.id;
    const enrollments = await Enrollment.find({ studentId, isActive: true });
    const weeklyTotalMinutes = Math.round(
      enrollments.reduce((sum: number, e: any) => sum + (e.totalTimeSpent || 0), 0) / 60
    );
    // Lacking per-day activity log; return summary only
    return res.json({ success: true, data: { daily: [], weeklyTotalMinutes } });
  }

  static async getInsights(req: Request, res: Response) {
    const studentId = (req as any).user?.id;
    const enrollments = await Enrollment.find({ studentId, isActive: true }).populate('courseId', 'title');
    const lowProgress = enrollments.filter((e: any) => (e.progress || 0) < 50);
    const recommendations = lowProgress.map((e: any) => ({
      courseId: e.courseId?._id || e.courseId,
      courseTitle: e.courseId?.title || undefined,
      suggestion: 'Review earlier sections and plan daily study time.'
    }));
    return res.json({ success: true, data: { recommendations, strengths: [], improvements: [] } });
  }
}


