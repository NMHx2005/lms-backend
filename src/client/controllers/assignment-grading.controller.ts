import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AuthenticatedRequest } from '../../shared/types/global';
import Submission from '../../shared/models/core/Submission';
import Assignment from '../../shared/models/core/Assignment';
import Course from '../../shared/models/core/Course';
import { ErrorFactory } from '../../shared/utils/errors';
import mongoose from 'mongoose';

export class AssignmentGradingController {
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
   * Get all submissions for an assignment (Teacher only)
   */
  static getSubmissions = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { assignmentId } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw ErrorFactory.validation('Invalid assignment ID');
    }

    const teacherId = req.user?.id;
    if (!teacherId) {
      throw ErrorFactory.authentication('User not authenticated');
    }

    // Check if user is teacher of the course
    await this.checkTeacherPermission(assignmentId, teacherId);

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw ErrorFactory.notFound('Assignment not found');
    }

    const query: any = { assignmentId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      // Search by student name (need to populate)
      const User = mongoose.model('User');
      const students = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const submissions = await Submission.find(query)
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Submission.countDocuments(query);

    // Format response
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      studentId: sub.studentId,
      studentName: (sub.studentId as any)?.name || 'Unknown',
      studentEmail: (sub.studentId as any)?.email,
      status: sub.status,
      submittedAt: sub.submittedAt,
      fileUrl: sub.fileUrl,
      textAnswer: sub.textAnswer,
      score: sub.score,
      feedback: sub.feedback,
      attemptNumber: sub.attemptNumber,
      isLate: sub.isLate,
    }));

    res.status(200).json({
      success: true,
      data: formattedSubmissions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  });

  /**
   * Grade a submission
   */
  static gradeSubmission = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { submissionId } = req.params;
    const { score, feedback, rubricScore, feedbackFiles, voiceFeedbackUrl, videoFeedbackUrl } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      throw ErrorFactory.authentication('User not authenticated');
    }

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      throw ErrorFactory.validation('Invalid submission ID');
    }

    const submission = await Submission.findById(submissionId).populate('assignmentId');
    if (!submission) {
      throw ErrorFactory.notFound('Submission not found');
    }

    const assignment = submission.assignmentId as any;
    if (!assignment) {
      throw ErrorFactory.notFound('Assignment not found');
    }

    // Check if user is teacher of the course
    await this.checkTeacherPermission(assignment._id.toString(), teacherId);

    // Validate score
    if (score < 0 || score > assignment.maxScore) {
      throw ErrorFactory.validation(`Score must be between 0 and ${assignment.maxScore}`);
    }

    // Update submission
    submission.score = score;
    submission.feedback = feedback || '';
    submission.gradedBy = new mongoose.Types.ObjectId(teacherId);
    submission.status = 'graded';
    submission.gradedAt = new Date();

    if (rubricScore) {
      submission.rubricScore = rubricScore;
    }
    if (feedbackFiles) {
      submission.feedbackFiles = feedbackFiles;
    }
    if (voiceFeedbackUrl) {
      submission.voiceFeedbackUrl = voiceFeedbackUrl;
    }
    if (videoFeedbackUrl) {
      submission.videoFeedbackUrl = videoFeedbackUrl;
    }

    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: submission,
    });
  });

  /**
   * Bulk grade submissions
   */
  static bulkGrade = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { submissionIds, score, feedback } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      throw ErrorFactory.authentication('User not authenticated');
    }

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      throw ErrorFactory.validation('Submission IDs are required');
    }

    const submissions = await Submission.find({
      _id: { $in: submissionIds },
    }).populate('assignmentId');

    if (submissions.length === 0) {
      throw ErrorFactory.notFound('No submissions found');
    }

    // Check if user is teacher of all assignments' courses
    const assignmentIds = [...new Set(submissions.map(s => (s.assignmentId as any)?._id?.toString()).filter(Boolean))];
    for (const assignmentId of assignmentIds) {
      if (assignmentId) {
        await this.checkTeacherPermission(assignmentId, teacherId);
      }
    }

    // Validate score for each assignment
    for (const submission of submissions) {
      const assignment = submission.assignmentId as any;
      if (score < 0 || score > assignment.maxScore) {
        throw ErrorFactory.validation(`Score ${score} is invalid for assignment with max score ${assignment.maxScore}`);
      }
    }

    // Update all submissions
    const updatePromises = submissions.map(submission => {
      submission.score = score;
      submission.feedback = feedback || '';
      submission.gradedBy = new mongoose.Types.ObjectId(teacherId);
      submission.status = 'graded';
      submission.gradedAt = new Date();
      return submission.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Graded ${submissions.length} submissions successfully`,
      data: { count: submissions.length },
    });
  });

  /**
   * Return submission for revision
   */
  static returnSubmission = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { submissionId } = req.params;
    const { feedback } = req.body;
    const teacherId = req.user?.id;

    if (!teacherId) {
      throw ErrorFactory.authentication('User not authenticated');
    }

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      throw ErrorFactory.validation('Invalid submission ID');
    }

    const submission = await Submission.findById(submissionId).populate('assignmentId');
    if (!submission) {
      throw ErrorFactory.notFound('Submission not found');
    }

    const assignment = submission.assignmentId as any;
    if (assignment?._id) {
      // Check if user is teacher of the course
      await this.checkTeacherPermission(assignment._id.toString(), teacherId);
    }

    submission.status = 'returned';
    submission.feedback = feedback || '';
    submission.gradedBy = new mongoose.Types.ObjectId(teacherId);
    await submission.save();

    res.status(200).json({
      success: true,
      message: 'Submission returned for revision',
      data: submission,
    });
  });

  /**
   * Get submission by ID (with student info)
   */
  static getSubmissionById = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { submissionId } = req.params;
    const teacherId = req.user?.id;

    if (!teacherId) {
      throw ErrorFactory.authentication('User not authenticated');
    }

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      throw ErrorFactory.validation('Invalid submission ID');
    }

    const submission = await Submission.findById(submissionId)
      .populate('studentId', 'name email')
      .populate('assignmentId')
      .populate('gradedBy', 'name email');

    if (!submission) {
      throw ErrorFactory.notFound('Submission not found');
    }

    const assignment = submission.assignmentId as any;
    if (assignment?._id) {
      // Check if user is teacher of the course
      await this.checkTeacherPermission(assignment._id.toString(), teacherId);
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  });
}
