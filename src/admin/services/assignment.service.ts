import Assignment, { IAssignment } from '../../shared/models/core/Assignment';
import mongoose from 'mongoose';

interface AssignmentFilters {
  page: number;
  limit: number;
  type?: string;
  isRequired?: boolean;
  status?: string;
}

interface SearchFilters {
  query: string;
  courseId?: string;
  lessonId?: string;
  type?: string;
  isRequired?: boolean;
  page: number;
  limit: number;
}

interface BulkUpdateData {
  assignmentId: string;
  updates: Partial<IAssignment>;
}

export class AdminAssignmentService {
  // Create new assignment
  async createAssignment(assignmentData: Partial<IAssignment>): Promise<IAssignment> {
    try {
      const assignment = new Assignment(assignmentData);
      await assignment.save();
      return assignment;
    } catch (error: any) {
      throw new Error(`Failed to create assignment: ${error.message}`);
    }
  }

  // Get assignment by ID
  async getAssignmentById(id: string): Promise<IAssignment | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }
      
      const assignment = await Assignment.findById(id)
        .populate('lessonId', 'title')
        .populate('courseId', 'title');
      
      return assignment;
    } catch (error: any) {
      throw new Error(`Failed to get assignment: ${error.message}`);
    }
  }

  // Get assignments by lesson
  async getAssignmentsByLesson(lessonId: string, filters: AssignmentFilters) {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new Error('Invalid lesson ID');
      }

      const { page, limit, type, isRequired } = filters;
      const skip = (page - 1) * limit;

      const query: any = { lessonId };
      if (type) query.type = type;
      if (isRequired !== undefined) query.isRequired = isRequired;

      const assignments = await Assignment.find(query)
        .populate('lessonId', 'title')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 })
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

  // Get assignments by course
  async getAssignmentsByCourse(courseId: string, filters: AssignmentFilters) {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }

      const { page, limit, type, isRequired, status } = filters;
      const skip = (page - 1) * limit;

      const query: any = { courseId };
      if (type) query.type = type;
      if (isRequired !== undefined) query.isRequired = isRequired;

      const assignments = await Assignment.find(query)
        .populate('lessonId', 'title')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 })
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

  // Update assignment
  async updateAssignment(id: string, updateData: Partial<IAssignment>): Promise<IAssignment> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }

      const assignment = await Assignment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('lessonId', 'title').populate('courseId', 'title');

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      return assignment;
    } catch (error: any) {
      throw new Error(`Failed to update assignment: ${error.message}`);
    }
  }

  // Delete assignment
  async deleteAssignment(id: string): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }

      const assignment = await Assignment.findByIdAndDelete(id);
      if (!assignment) {
        throw new Error('Assignment not found');
      }
    } catch (error: any) {
      throw new Error(`Failed to delete assignment: ${error.message}`);
    }
  }

  // Toggle assignment required status
  async toggleAssignmentRequired(id: string, isRequired: boolean): Promise<IAssignment> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }

      const assignment = await Assignment.findByIdAndUpdate(
        id,
        { isRequired },
        { new: true, runValidators: true }
      ).populate('lessonId', 'title').populate('courseId', 'title');

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      return assignment;
    } catch (error: any) {
      throw new Error(`Failed to toggle assignment required status: ${error.message}`);
    }
  }

  // Get assignment statistics
  async getAssignmentStats(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Get submission statistics
      const Submission = mongoose.model('Submission');
      const totalSubmissions = await Submission.countDocuments({ assignmentId: id });
      const gradedSubmissions = await Submission.countDocuments({ 
        assignmentId: id, 
        status: 'graded' 
      });
      const lateSubmissions = await Submission.countDocuments({ 
        assignmentId: id, 
        isLate: true 
      });

      // Get average score
      const avgScoreResult = await Submission.aggregate([
        { $match: { assignmentId: new mongoose.Types.ObjectId(id), status: 'graded' } },
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ]);

      const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;

      return {
        assignmentId: id,
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions: totalSubmissions - gradedSubmissions,
        lateSubmissions,
        averageScore: Math.round(avgScore * 100) / 100,
        completionRate: totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0
      };
    } catch (error: any) {
      throw new Error(`Failed to get assignment statistics: ${error.message}`);
    }
  }

  // Get overdue assignments
  async getOverdueAssignments(filters: { page: number; limit: number; courseId?: string }) {
    try {
      const { page, limit, courseId } = filters;
      const skip = (page - 1) * limit;

      const query: any = { dueDate: { $lt: new Date() } };
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
      throw new Error(`Failed to get overdue assignments: ${error.message}`);
    }
  }

  // Bulk update assignments
  async bulkUpdateAssignments(courseId: string, updates: BulkUpdateData[]) {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid course ID');
      }

      const results = [];
      for (const update of updates) {
        if (!mongoose.Types.ObjectId.isValid(update.assignmentId)) {
          results.push({
            assignmentId: update.assignmentId,
            success: false,
            error: 'Invalid assignment ID'
          });
          continue;
        }

        try {
          const assignment = await Assignment.findByIdAndUpdate(
            update.assignmentId,
            update.updates,
            { new: true, runValidators: true }
          );

          if (assignment) {
            results.push({
              assignmentId: update.assignmentId,
              success: true,
              data: assignment
            });
          } else {
            results.push({
              assignmentId: update.assignmentId,
              success: false,
              error: 'Assignment not found'
            });
          }
        } catch (error: any) {
          results.push({
            assignmentId: update.assignmentId,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error: any) {
      throw new Error(`Failed to bulk update assignments: ${error.message}`);
    }
  }

  // Add attachment to assignment
  async addAttachment(id: string, attachmentData: any): Promise<IAssignment> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }

      const assignment = await Assignment.findByIdAndUpdate(
        id,
        { $push: { attachments: attachmentData } },
        { new: true, runValidators: true }
      ).populate('lessonId', 'title').populate('courseId', 'title');

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      return assignment;
    } catch (error: any) {
      throw new Error(`Failed to add attachment: ${error.message}`);
    }
  }

  // Remove attachment from assignment
  async removeAttachment(id: string, attachmentIndex: number): Promise<IAssignment> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid assignment ID');
      }

      const assignment = await Assignment.findById(id);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      if (!assignment.attachments || attachmentIndex >= assignment.attachments.length) {
        throw new Error('Invalid attachment index');
      }

      assignment.attachments.splice(attachmentIndex, 1);
      await assignment.save();

      return (await assignment.populate('lessonId', 'title')).populate('courseId', 'title');
    } catch (error: any) {
      throw new Error(`Failed to remove attachment: ${error.message}`);
    }
  }

  // Search assignments
  async searchAssignments(filters: SearchFilters) {
    try {
      const { query, courseId, lessonId, type, isRequired, page, limit } = filters;
      const skip = (page - 1) * limit;

      const searchQuery: any = {
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

      if (lessonId) {
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
          throw new Error('Invalid lesson ID');
        }
        searchQuery.lessonId = lessonId;
      }

      if (type) searchQuery.type = type;
      if (isRequired !== undefined) searchQuery.isRequired = isRequired;

      const assignments = await Assignment.find(searchQuery)
        .populate('lessonId', 'title')
        .populate('courseId', 'title')
        .sort({ createdAt: -1 })
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
}
