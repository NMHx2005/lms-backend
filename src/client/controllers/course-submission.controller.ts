import { Response } from 'express';
import mongoose from 'mongoose';
import { aiEvaluationService } from '../../shared/services/ai/evaluation.service';
import Course from '../../shared/models/core/Course';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';

export class CourseSubmissionController {
  
  // Submit course for AI evaluation
  static submitCourseForEvaluation = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    // Check if user owns the course
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user!.id
    });

    if (!course) {
      throw new AppError('Course not found or access denied', 404);
    }

    // Check if course can be submitted
    if (!course.canSubmitForReview) {
      throw new AppError('Course is not ready for submission or already submitted', 400);
    }

    const submissionData = {
      courseId,
      submittedBy: {
        userId: req.user!.id,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
        role: req.user!.role
      }
    };

    const evaluation = await aiEvaluationService.submitCourseForEvaluation(submissionData);

    res.status(201).json({
      success: true,
      message: 'Course submitted for AI evaluation successfully',
      data: {
        evaluationId: evaluation._id,
        courseId,
        submittedAt: evaluation.submittedAt,
        status: evaluation.status
      }
    });
  });

  // Get submission status for a course
  static getCourseSubmissionStatus = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    // Check if user owns the course
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user!.id
    }).populate('aiEvaluation.evaluationId');

    if (!course) {
      throw new AppError('Course not found or access denied', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Course submission status retrieved successfully',
      data: {
        courseId,
        courseTitle: course.title,
        status: course.status,
        detailedStatus: course.detailedStatus,
        submittedAt: course.submittedAt,
        canSubmitForReview: course.canSubmitForReview,
        isInReview: course.isInReview,
        needsAction: course.needsAction,
        aiEvaluation: course.aiEvaluation,
        submittedForReview: course.submittedForReview
      }
    });
  });

  // Get all evaluations for current teacher
  static getMyEvaluations = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      page = 1,
      limit = 20
    } = req.query;

    const result = await aiEvaluationService.getEvaluationsByTeacher(
      req.user!.id,
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Your evaluations retrieved successfully',
      data: result
    });
  });

  // Get detailed evaluation result
  static getEvaluationDetails = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { evaluationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new AppError('Invalid evaluation ID', 400);
    }

    const evaluation = await aiEvaluationService.getEvaluationById(evaluationId);

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check if teacher owns this evaluation
    if (evaluation.submittedBy.userId.toString() !== req.user!.id) {
      throw new AppError('Access denied', 403);
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation details retrieved successfully',
      data: evaluation
    });
  });

  // Get teacher's courses that can be submitted for review
  static getSubmittableCourses = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const courses = await Course.find({
      instructorId: req.user!.id,
      status: 'draft',
      submittedForReview: false
    }).select('title description status canSubmitForReview createdAt updatedAt');

    res.status(200).json({
      success: true,
      message: 'Submittable courses retrieved successfully',
      data: {
        courses,
        total: courses.length
      }
    });
  });

  // Get teacher's courses that need revision
  static getCoursesNeedingRevision = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const courses = await Course.find({
      instructorId: req.user!.id,
      status: 'needs_revision'
    }).populate('aiEvaluation.evaluationId').select('title description status needsAction aiEvaluation submittedAt');

    res.status(200).json({
      success: true,
      message: 'Courses needing revision retrieved successfully',
      data: {
        courses,
        total: courses.length
      }
    });
  });

  // Get teacher's submission statistics
  static getSubmissionStatistics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const teacherId = req.user!.id;

    const [
      totalSubmissions,
      pendingReview,
      approved,
      rejected,
      needsRevision,
      averageScore
    ] = await Promise.all([
      Course.countDocuments({ instructorId: teacherId, submittedForReview: true }),
      Course.countDocuments({ instructorId: teacherId, status: 'submitted' }),
      Course.countDocuments({ instructorId: teacherId, status: 'approved' }),
      Course.countDocuments({ instructorId: teacherId, status: 'rejected' }),
      Course.countDocuments({ instructorId: teacherId, status: 'needs_revision' }),
      Course.aggregate([
        { $match: { instructorId: new mongoose.Types.ObjectId(teacherId), 'aiEvaluation.overallScore': { $exists: true } } },
        { $group: { _id: null, avgScore: { $avg: '$aiEvaluation.overallScore' } } }
      ])
    ]);

    const stats = {
      totalSubmissions,
      pendingReview,
      approved,
      rejected,
      needsRevision,
      averageAIScore: averageScore[0]?.avgScore || 0,
      approvalRate: totalSubmissions > 0 ? (approved / totalSubmissions * 100) : 0
    };

    res.status(200).json({
      success: true,
      message: 'Submission statistics retrieved successfully',
      data: stats
    });
  });

  // Resubmit course after revision
  static resubmitCourse = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    // Check if user owns the course
    const course = await Course.findOne({
      _id: courseId,
      instructorId: req.user!.id
    });

    if (!course) {
      throw new AppError('Course not found or access denied', 404);
    }

    // Check if course needs revision
    if (course.status !== 'needs_revision') {
      throw new AppError('Course does not need revision', 400);
    }

    // Reset status to allow resubmission
    course.status = 'draft';
    course.submittedForReview = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course reset for resubmission successfully',
      data: {
        courseId,
        status: course.status,
        canSubmitForReview: course.canSubmitForReview
      }
    });
  });

  // Get evaluation feedback summary
  static getEvaluationFeedback = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { evaluationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new AppError('Invalid evaluation ID', 400);
    }

    const evaluation = await aiEvaluationService.getEvaluationById(evaluationId);

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check if teacher owns this evaluation
    if (evaluation.submittedBy.userId.toString() !== req.user!.id) {
      throw new AppError('Access denied', 403);
    }

    // Extract feedback summary
    const feedback = {
      overallScore: evaluation.aiAnalysis?.overallScore || 0,
      strengths: evaluation.aiAnalysis?.strengths || [],
      weaknesses: evaluation.aiAnalysis?.weaknesses || [],
      recommendations: evaluation.aiAnalysis?.recommendations || [],
      detailedFeedback: {
        contentQuality: evaluation.aiAnalysis?.contentQuality,
        structureQuality: evaluation.aiAnalysis?.structureQuality,
        educationalValue: evaluation.aiAnalysis?.educationalValue,
        completeness: evaluation.aiAnalysis?.completeness
      },
      adminFeedback: evaluation.adminReview?.adminFeedback,
      adminComments: evaluation.adminReview?.adminComments,
      revisionRequested: evaluation.adminReview?.revisionRequested
    };

    res.status(200).json({
      success: true,
      message: 'Evaluation feedback retrieved successfully',
      data: feedback
    });
  });
}
