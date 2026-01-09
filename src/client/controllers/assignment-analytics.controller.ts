import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AuthenticatedRequest } from '../../shared/types/global';
import Submission from '../../shared/models/core/Submission';
import Assignment from '../../shared/models/core/Assignment';
import Course from '../../shared/models/core/Course';
import { ErrorFactory } from '../../shared/utils/errors';
import mongoose from 'mongoose';

export class AssignmentAnalyticsController {
  /**
   * Helper function to check if user is teacher of the course
   */
  private static async checkTeacherPermission(assignmentId: string, userId: string): Promise<void> {
    const assignment = await Assignment.findById(assignmentId).populate('courseId');
    if (!assignment) {
      throw ErrorFactory.notFound('Assignment not found');
    }

    const course = await Course.findById(assignment.courseId);
    if (!course) {
      throw ErrorFactory.notFound('Course not found');
    }

    // Check if user is the instructor of the course
    if (course.instructorId.toString() !== userId) {
      // Check if user is admin
      const User = mongoose.model('User');
      const user = await User.findById(userId);
      if (!user || !user.roles?.includes('admin')) {
        throw ErrorFactory.authorization('Only course teacher or admin can access this resource');
      }
    }
  }
  /**
   * Get assignment analytics
   */
  static getAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { assignmentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw ErrorFactory.authentication('User not authenticated');
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw ErrorFactory.validation('Invalid assignment ID');
    }

    // Check if user is teacher of the course
    await this.checkTeacherPermission(assignmentId, userId);

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw ErrorFactory.notFound('Assignment not found');
    }

    // Get all submissions
    const submissions = await Submission.find({ assignmentId })
      .populate('studentId', 'name email');

    const totalStudents = await mongoose.model('Enrollment').countDocuments({
      courseId: assignment.courseId,
      isActive: true,
    });

    const submittedCount = submissions.filter(s => s.status !== 'draft').length;
    const gradedCount = submissions.filter(s => s.status === 'graded').length;
    const lateCount = submissions.filter(s => s.isLate).length;

    // Calculate scores
    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== undefined);
    const scores = gradedSubmissions.map(s => s.score!);

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    const sortedScores = [...scores].sort((a, b) => a - b);
    const medianScore = sortedScores.length > 0
      ? sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)]
      : 0;

    // Grade distribution
    const gradeRanges = [
      { min: 90, max: 100, label: '90-100' },
      { min: 80, max: 89, label: '80-89' },
      { min: 70, max: 79, label: '70-79' },
      { min: 60, max: 69, label: '60-69' },
      { min: 0, max: 59, label: '0-59' },
    ];

    const gradeDistribution = gradeRanges.map(range => {
      const count = scores.filter(score => score >= range.min && score <= range.max).length;
      return {
        range: range.label,
        count,
        percentage: scores.length > 0 ? (count / scores.length) * 100 : 0,
      };
    });

    // Top performers
    const topPerformers = gradedSubmissions
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
      .map(sub => ({
        studentId: (sub.studentId as any)?._id?.toString() || '',
        studentName: (sub.studentId as any)?.name || 'Unknown',
        score: sub.score || 0,
      }));

    const analytics = {
      totalStudents,
      submittedCount,
      gradedCount,
      averageScore: Math.round(averageScore * 10) / 10,
      medianScore: Math.round(medianScore * 10) / 10,
      submissionRate: totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0,
      lateSubmissionRate: submittedCount > 0 ? (lateCount / submittedCount) * 100 : 0,
      gradeDistribution,
      topPerformers,
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  });

  /**
   * Get student performance analytics
   */
  static getStudentPerformance = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { assignmentId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw ErrorFactory.validation('Invalid assignment or student ID');
    }

    const submissions = await Submission.find({
      assignmentId,
      studentId,
    }).sort({ submittedAt: -1 });

    if (submissions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          submissions: [],
          bestScore: null,
          averageScore: null,
          improvement: null,
        },
      });
    }

    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== undefined);
    const scores = gradedSubmissions.map(s => s.score!);

    const bestScore = scores.length > 0 ? Math.max(...scores) : null;
    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

    // Calculate improvement trend
    let improvement = null;
    if (scores.length >= 2) {
      const firstScore = scores[scores.length - 1];
      const lastScore = scores[0];
      improvement = lastScore - firstScore;
    }

    res.status(200).json({
      success: true,
      data: {
        submissions: submissions.map(s => ({
          _id: s._id,
          status: s.status,
          score: s.score,
          submittedAt: s.submittedAt,
          attemptNumber: s.attemptNumber,
        })),
        bestScore,
        averageScore: averageScore ? Math.round(averageScore * 10) / 10 : null,
        improvement,
      },
    });
  });
}
