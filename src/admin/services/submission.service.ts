import Submission, { ISubmission } from '../../shared/models/core/Submission';
import Assignment, { IAssignment } from '../../shared/models/core/Assignment';
import mongoose from 'mongoose';

interface SubmissionFilters {
  page: number;
  limit: number;
  status?: string;
  isLate?: boolean;
  courseId?: string;
  assignmentId?: string;
}

interface GradingData {
  score: number;
  feedback: string;
  gradedBy: string;
}

interface SearchFilters {
  query: string;
  courseId?: string;
  assignmentId?: string;
  studentId?: string;
  status?: string;
  page: number;
  limit: number;
}

export class AdminSubmissionService {
  // Get submission by ID
  async getSubmissionById(id: string): Promise<ISubmission | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid submission ID');
      }
      
      const submission = await Submission.findById(id)
        .populate('assignmentId', 'title description maxScore')
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'title')
        .populate('gradedBy', 'firstName lastName');
      
      return submission;
    } catch (error: any) {
      throw new Error(`Failed to get submission: ${error.message}`);
    }
  }

  // Get submissions by assignment
  async getSubmissionsByAssignment(assignmentId: string, filters: SubmissionFilters) {
    try {
      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        throw new Error('Invalid assignment ID');
      }

      const { page, limit, status, isLate } = filters;
      const skip = (page - 1) * limit;

      const query: any = { assignmentId };
      if (status) query.status = status;
      if (isLate !== undefined) query.isLate = isLate;

      const submissions = await Submission.find(query)
        .populate('assignmentId', 'title description maxScore')
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'title')
        .populate('gradedBy', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Submission.countDocuments(query);

      return {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get submissions by assignment: ${error.message}`);
    }
  }

  // Get submissions by course
  async getSubmissionsByCourse(courseId: string, filters: SubmissionFilters) {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }

      const { page, limit, status, isLate, assignmentId } = filters;
      const skip = (page - 1) * limit;

      const query: any = { courseId };
      if (status) query.status = status;
      if (isLate !== undefined) query.isLate = isLate;
      if (assignmentId) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
          throw new Error('Invalid assignment ID');
        }
        query.assignmentId = assignmentId;
      }

      const submissions = await Submission.find(query)
        .populate('assignmentId', 'title description maxScore')
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'title')
        .populate('gradedBy', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Submission.countDocuments(query);

      return {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get submissions by course: ${error.message}`);
    }
  }

  // Get pending submissions
  async getPendingSubmissions(filters: { page: number; limit: number; courseId?: string; assignmentId?: string }) {
    try {
      const { page, limit, courseId, assignmentId } = filters;
      const skip = (page - 1) * limit;

      const query: any = { status: 'submitted' };
      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        query.courseId = courseId;
      }
      if (assignmentId) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
          throw new Error('Invalid assignment ID');
        }
        query.assignmentId = assignmentId;
      }

      const submissions = await Submission.find(query)
        .populate('assignmentId', 'title description maxScore dueDate')
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'title')
        .sort({ submittedAt: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Submission.countDocuments(query);

      return {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get pending submissions: ${error.message}`);
    }
  }

  // Get late submissions
  async getLateSubmissions(filters: { page: number; limit: number; courseId?: string; assignmentId?: string }) {
    try {
      const { page, limit, courseId, assignmentId } = filters;
      const skip = (page - 1) * limit;

      const query: any = { isLate: true };
      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        query.courseId = courseId;
      }
      if (assignmentId) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
          throw new Error('Invalid assignment ID');
        }
        query.assignmentId = assignmentId;
      }

      const submissions = await Submission.find(query)
        .populate('assignmentId', 'title description maxScore dueDate')
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Submission.countDocuments(query);

      return {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get late submissions: ${error.message}`);
    }
  }

  // Grade submission
  async gradeSubmission(id: string, gradingData: GradingData): Promise<ISubmission> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid submission ID');
      }

      const submission = await Submission.findById(id);
      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.status === 'graded') {
        throw new Error('Submission already graded');
      }

      // Validate score
      const assignment = await Assignment.findById(submission.assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (gradingData.score < 0 || gradingData.score > assignment.maxScore) {
        throw new Error(`Score must be between 0 and ${assignment.maxScore}`);
      }

      // Update submission
      submission.score = gradingData.score;
      submission.feedback = gradingData.feedback;
      submission.gradedBy = new mongoose.Types.ObjectId(gradingData.gradedBy);
      submission.gradedAt = new Date();
      submission.status = 'graded';

      await submission.save();

      const populatedSubmission = await submission.populate([
        { path: 'assignmentId', select: 'title description maxScore' },
        { path: 'studentId', select: 'firstName lastName email' },
        { path: 'courseId', select: 'title' },
        { path: 'gradedBy', select: 'firstName lastName' }
      ]);
      
      return populatedSubmission;
    } catch (error: any) {
      throw new Error(`Failed to grade submission: ${error.message}`);
    }
  }

  // Update submission
  async updateSubmission(id: string, updateData: Partial<ISubmission>): Promise<ISubmission> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid submission ID');
      }

      const submission = await Submission.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!submission) {
        throw new Error('Submission not found');
      }

      const populatedSubmission = await submission.populate([
        { path: 'assignmentId', select: 'title description maxScore' },
        { path: 'studentId', select: 'firstName lastName email' },
        { path: 'courseId', select: 'title' },
        { path: 'gradedBy', select: 'firstName lastName' }
      ]);

      return populatedSubmission;
    } catch (error: any) {
      throw new Error(`Failed to update submission: ${error.message}`);
    }
  }

  // Delete submission
  async deleteSubmission(id: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid submission ID');
      }

      const submission = await Submission.findByIdAndDelete(id);
      if (!submission) {
        throw new Error('Submission not found');
      }
    } catch (error: any) {
      throw new Error(`Failed to delete submission: ${error.message}`);
    }
  }

  // Get submission statistics
  async getSubmissionStats(assignmentId?: string, courseId?: string) {
    try {
      const query: any = {};
      if (assignmentId) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
          throw new Error('Invalid assignment ID');
        }
        query.assignmentId = assignmentId;
      }
      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        query.courseId = courseId;
      }

      const totalSubmissions = await Submission.countDocuments(query);
      const gradedSubmissions = await Submission.countDocuments({ ...query, status: 'graded' });
      const pendingSubmissions = await Submission.countDocuments({ ...query, status: 'submitted' });
      const lateSubmissions = await Submission.countDocuments({ ...query, isLate: true });

      // Get average score for graded submissions
      const avgScoreResult = await Submission.aggregate([
        { $match: { ...query, status: 'graded' } },
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]);

      const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;

      // Get score distribution
      const scoreDistribution = await Submission.aggregate([
        { $match: { ...query, status: 'graded' } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ['$score', 60] }, then: 'F' },
                  { case: { $lt: ['$score', 70] }, then: 'D' },
                  { case: { $lt: ['$score', 80] }, then: 'C' },
                  { case: { $lt: ['$score', 90] }, then: 'B' },
                  { case: { $lt: ['$score', 101] }, then: 'A' }
                ],
                default: 'F'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions,
        lateSubmissions,
        averageScore: Math.round(avgScore * 100) / 100,
        completionRate: totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0,
        lateRate: totalSubmissions > 0 ? (lateSubmissions / totalSubmissions) * 100 : 0,
        scoreDistribution
      };
    } catch (error: any) {
      throw new Error(`Failed to get submission statistics: ${error.message}`);
    }
  }

  // Bulk grade submissions
  async bulkGradeSubmissions(gradingData: Array<{ submissionId: string; score: number; feedback: string; gradedBy: string }>) {
    try {
      const results = [];
      
      for (const grade of gradingData) {
        if (!mongoose.Types.ObjectId.isValid(grade.submissionId)) {
          results.push({
            submissionId: grade.submissionId,
            success: false,
            error: 'Invalid submission ID'
          });
          continue;
        }

        try {
          const submission = await this.gradeSubmission(grade.submissionId, {
            score: grade.score,
            feedback: grade.feedback,
            gradedBy: grade.gradedBy
          });

          results.push({
            submissionId: grade.submissionId,
            success: true,
            data: submission
          });
        } catch (error: any) {
          results.push({
            submissionId: grade.submissionId,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error: any) {
      throw new Error(`Failed to bulk grade submissions: ${error.message}`);
    }
  }

  // Search submissions
  async searchSubmissions(filters: SearchFilters) {
    try {
      const { query, courseId, assignmentId, studentId, status, page, limit } = filters;
      const skip = (page - 1) * limit;

      const searchQuery: any = {
        $or: [
          { textAnswer: { $regex: query, $options: 'i' } },
          { feedback: { $regex: query, $options: 'i' } }
        ]
      };

      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        searchQuery.courseId = courseId;
      }

      if (assignmentId) {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
          throw new Error('Invalid assignment ID');
        }
        searchQuery.assignmentId = assignmentId;
      }

      if (studentId) {
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
          throw new Error('Invalid student ID');
        }
        searchQuery.studentId = studentId;
      }

      if (status) searchQuery.status = status;

      const submissions = await Submission.find(searchQuery)
        .populate('assignmentId', 'title description maxScore')
        .populate('studentId', 'firstName lastName email')
        .populate('courseId', 'title')
        .populate('gradedBy', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Submission.countDocuments(searchQuery);

      return {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to search submissions: ${error.message}`);
    }
  }

  // Get submission analytics
  async getSubmissionAnalytics(courseId?: string, timeRange?: { start: Date; end: Date }) {
    try {
      const query: any = {};
      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        query.courseId = courseId;
      }

      if (timeRange) {
        query.submittedAt = {
          $gte: timeRange.start,
          $lte: timeRange.end
        };
      }

      // Daily submission trends
      const dailyTrends = await Submission.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' }
            },
            count: { $sum: 1 },
            avgScore: { $avg: '$score' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Status distribution over time
      const statusTrends = await Submission.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1, '_id.status': 1 } }
      ]);

      // Performance by assignment type
      const performanceByType = await Submission.aggregate([
        { $match: { ...query, status: 'graded' } },
        {
          $lookup: {
            from: 'assignments',
            localField: 'assignmentId',
            foreignField: '_id',
            as: 'assignment'
          }
        },
        { $unwind: '$assignment' },
        {
          $group: {
            _id: '$assignment.type',
            avgScore: { $avg: '$score' },
            totalSubmissions: { $sum: 1 },
            completionRate: { $avg: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } }
          }
        }
      ]);

      return {
        dailyTrends,
        statusTrends,
        performanceByType,
        totalSubmissions: await Submission.countDocuments(query),
        totalGraded: await Submission.countDocuments({ ...query, status: 'graded' }),
        totalPending: await Submission.countDocuments({ ...query, status: 'submitted' })
      };
    } catch (error: any) {
      throw new Error(`Failed to get submission analytics: ${error.message}`);
    }
  }
}
