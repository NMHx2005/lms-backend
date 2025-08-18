import Assignment, { IAssignment } from '../../shared/models/core/Assignment';
import Submission, { ISubmission } from '../../shared/models/core/Submission';
import mongoose from 'mongoose';

interface AssignmentFilters {
  page: number;
  limit: number;
  type?: string;
  isRequired?: boolean;
}

interface SubmissionData {
  assignmentId: string;
  studentId: string;
  courseId: string;
  answers?: any[];
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  textAnswer?: string;
}

export class ClientAssignmentService {
  // Get assignment by ID for student
  async getAssignmentById(id: string, studentId: string): Promise<IAssignment | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }
      
      const assignment = await Assignment.findById(id)
        .populate('lessonId', 'title')
        .populate('courseId', 'title');
      
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Check if student is enrolled in the course
      const Enrollment = mongoose.model('Enrollment');
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId: assignment.courseId,
        isActive: true
      });

      if (!enrollment) {
        throw new Error('Student not enrolled in this course');
      }

      return assignment;
    } catch (error: any) {
      throw new Error(`Failed to get assignment: ${error.message}`);
    }
  }

  // Get assignments by lesson for student
  async getAssignmentsByLesson(lessonId: string, studentId: string, filters: AssignmentFilters) {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new Error('Invalid lesson ID');
      }

      const { page, limit, type, isRequired } = filters;
      const skip = (page - 1) * limit;

      // First get the lesson to find the course
      const Lesson = mongoose.model('Lesson');
      const lesson = await Lesson.findById(lessonId).select('courseId');
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      // Check if student is enrolled in the course
      const Enrollment = mongoose.model('Enrollment');
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId: lesson.courseId,
        isActive: true
      });

      if (!enrollment) {
        throw new Error('Student not enrolled in this course');
      }

      const query: any = { lessonId };
      if (type) query.type = type;
      if (isRequired !== undefined) query.isRequired = isRequired;

      const assignments = await Assignment.find(query)
        .populate('lessonId', 'title')
        .populate('courseId', 'title')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Assignment.countDocuments(query);

      return {
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get assignments by lesson: ${error.message}`);
    }
  }

  // Get assignments by course for student
  async getAssignmentsByCourse(courseId: string, studentId: string, filters: AssignmentFilters) {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }

      // Check if student is enrolled in the course
      const Enrollment = mongoose.model('Enrollment');
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId,
        isActive: true
      });

      if (!enrollment) {
        throw new Error('Student not enrolled in this course');
      }

      const { page, limit, type, isRequired } = filters;
      const skip = (page - 1) * limit;

      const query: any = { courseId };
      if (type) query.type = type;
      if (isRequired !== undefined) query.isRequired = isRequired;

      const assignments = await Assignment.find(query)
        .populate('lessonId', 'title')
        .populate('courseId', 'title')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Assignment.countDocuments(query);

      return {
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get assignments by course: ${error.message}`);
    }
  }

  // Get upcoming assignments for student
  async getUpcomingAssignments(studentId: string, filters: { page: number; limit: number; courseId?: string }) {
    try {
      const { page, limit, courseId } = filters;
      const skip = (page - 1) * limit;

      // Get enrolled courses
      const Enrollment = mongoose.model('Enrollment');
      const enrollments = await Enrollment.find({
        studentId,
        isActive: true
      }).select('courseId');

      const courseIds = enrollments.map(e => e.courseId);

      const query: any = {
        courseId: { $in: courseIds },
        dueDate: { $gt: new Date() }
      };

      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        query.courseId = courseId;
      }

      const assignments = await Assignment.find(query)
        .populate('lessonId', 'title')
        .populate('courseId', 'title')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Assignment.countDocuments(query);

      return {
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get upcoming assignments: ${error.message}`);
    }
  }

  // Get assignment progress for student
  async getAssignmentProgress(assignmentId: string, studentId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        throw new Error('Invalid assignment ID');
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Check if student is enrolled in the course
      const Enrollment = mongoose.model('Enrollment');
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId: assignment.courseId,
        isActive: true
      });

      if (!enrollment) {
        throw new Error('Student not enrolled in this course');
      }

      // Get submission
      const submission = await Submission.findOne({
        assignmentId,
        studentId
      }).sort({ submittedAt: -1 });

      const now = new Date();
      const isOverdue = assignment.dueDate && now > assignment.dueDate;
      const timeRemaining = assignment.dueDate ? Math.max(0, assignment.dueDate.getTime() - now.getTime()) : null;

      return {
        assignmentId,
        studentId,
        isSubmitted: !!submission,
        submissionCount: submission ? submission.attemptNumber : 0,
        lastSubmission: submission ? submission.submittedAt : null,
        isGraded: submission ? submission.status === 'graded' : false,
        score: submission && submission.status === 'graded' ? submission.score : null,
        feedback: submission && submission.status === 'graded' ? submission.feedback : null,
        isOverdue,
        timeRemaining,
        canSubmit: assignment.attempts ? (submission ? submission.attemptNumber < assignment.attempts : true) : true,
        maxAttempts: assignment.attempts || null
      };
    } catch (error: any) {
      throw new Error(`Failed to get assignment progress: ${error.message}`);
    }
  }

  // Submit assignment
  async submitAssignment(submissionData: SubmissionData): Promise<ISubmission> {
    try {
      const { assignmentId, studentId, courseId } = submissionData;

      if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        throw new Error('Invalid assignment ID');
      }

      // Check if student is enrolled in the course
      const Enrollment = mongoose.model('Enrollment');
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId,
        isActive: true
      });

      if (!enrollment) {
        throw new Error('Student not enrolled in this course');
      }

      // Get assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (assignment.courseId.toString() !== courseId) {
        throw new Error('Assignment does not belong to the specified course');
      }

      // Check if assignment is still open
      if (assignment.dueDate && new Date() > assignment.dueDate) {
        throw new Error('Assignment deadline has passed');
      }

      // Check attempt limit
      const existingSubmissions = await Submission.find({
        assignmentId,
        studentId
      });

      if (assignment.attempts && existingSubmissions.length >= assignment.attempts) {
        throw new Error('Maximum attempts reached for this assignment');
      }

      // Validate submission content based on assignment type
      if (assignment.type === 'file' && !submissionData.fileUrl) {
        throw new Error('File upload is required for this assignment');
      }

      if (assignment.type === 'text' && !submissionData.textAnswer) {
        throw new Error('Text answer is required for this assignment');
      }

      if (assignment.type === 'quiz' && (!submissionData.answers || submissionData.answers.length === 0)) {
        throw new Error('Quiz answers are required for this assignment');
      }

      // Create submission
      const submission = new Submission({
        ...submissionData,
        attemptNumber: existingSubmissions.length + 1,
        submittedAt: new Date(),
        status: 'submitted'
      });

      await submission.save();

      return submission.populate('assignmentId', 'title description maxScore');
    } catch (error: any) {
      throw new Error(`Failed to submit assignment: ${error.message}`);
    }
  }

  // Get student's submissions
  async getStudentSubmissions(studentId: string, filters: { page: number; limit: number; courseId?: string; assignmentId?: string; status?: string }) {
    try {
      const { page, limit, courseId, assignmentId, status } = filters;
      const skip = (page - 1) * limit;

      const query: any = { studentId };
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
      if (status) query.status = status;

      const submissions = await Submission.find(query)
        .populate('assignmentId', 'title description maxScore dueDate')
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
      throw new Error(`Failed to get student submissions: ${error.message}`);
    }
  }

  // Get submission by ID for student
  async getSubmissionById(id: string, studentId: string): Promise<ISubmission | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid submission ID');
      }
      
      const submission = await Submission.findById(id)
        .populate('assignmentId', 'title description maxScore dueDate')
        .populate('courseId', 'title');
      
      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.studentId.toString() !== studentId) {
        throw new Error('Access denied to this submission');
      }

      return submission;
    } catch (error: any) {
      throw new Error(`Failed to get submission: ${error.message}`);
    }
  }

  // Search assignments for student
  async searchAssignments(query: string, studentId: string, filters: { page: number; limit: number; courseId?: string; type?: string }) {
    try {
      const { page, limit, courseId, type } = filters;
      const skip = (page - 1) * limit;

      // Get enrolled courses
      const Enrollment = mongoose.model('Enrollment');
      const enrollments = await Enrollment.find({
        studentId,
        isActive: true
      }).select('courseId');

      const courseIds = enrollments.map(e => e.courseId);

      const searchQuery: any = {
        courseId: { $in: courseIds },
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { instructions: { $regex: query, $options: 'i' } }
        ]
      };

      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        searchQuery.courseId = courseId;
      }

      if (type) searchQuery.type = type;

      const assignments = await Assignment.find(searchQuery)
        .populate('lessonId', 'title')
        .populate('courseId', 'title')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Assignment.countDocuments(searchQuery);

      return {
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to search assignments: ${error.message}`);
    }
  }

  // Get assignment statistics for student
  async getStudentAssignmentStats(studentId: string, courseId?: string) {
    try {
      // Get enrolled courses
      const Enrollment = mongoose.model('Enrollment');
      const enrollments = await Enrollment.find({
        studentId,
        isActive: true
      }).select('courseId');

      const courseIds = enrollments.map(e => e.courseId);

      const query: any = { courseId: { $in: courseIds } };
      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          throw new Error('Invalid course ID');
        }
        query.courseId = courseId;
      }

      const totalAssignments = await Assignment.countDocuments(query);
      const totalSubmissions = await Submission.countDocuments({ ...query, studentId });
      const gradedSubmissions = await Submission.countDocuments({ ...query, studentId, status: 'graded' });
      const lateSubmissions = await Submission.countDocuments({ ...query, studentId, isLate: true });

      // Get average score
      const avgScoreResult = await Submission.aggregate([
        { $match: { ...query, studentId: new mongoose.Types.ObjectId(studentId), status: 'graded' } },
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]);

      const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;

      return {
        totalAssignments,
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions: totalSubmissions - gradedSubmissions,
        lateSubmissions,
        averageScore: Math.round(avgScore * 100) / 100,
        completionRate: totalAssignments > 0 ? (totalSubmissions / totalAssignments) * 100 : 0,
        onTimeRate: totalSubmissions > 0 ? ((totalSubmissions - lateSubmissions) / totalSubmissions) * 100 : 0
      };
    } catch (error: any) {
      throw new Error(`Failed to get student assignment statistics: ${error.message}`);
    }
  }
}
