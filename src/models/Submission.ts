import mongoose, { Document, Schema } from 'mongoose';

// Submission interface
export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  answers?: string[];
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  textAnswer?: string;
  score?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  submittedAt: Date;
  gradedAt?: Date;
  attemptNumber: number;
  status: 'submitted' | 'graded' | 'late' | 'overdue';
  isLate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Submission schema
const submissionSchema = new Schema<ISubmission>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    answers: {
      type: [String],
      validate: {
        validator: function (answers: string[]) {
          return !answers || answers.every(answer => answer.length <= 1000);
        },
        message: 'Each answer cannot exceed 1000 characters',
      },
    },
    fileUrl: {
      type: String,
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
    },
    fileType: {
      type: String,
    },
    textAnswer: {
      type: String,
      maxlength: [10000, 'Text answer cannot exceed 10000 characters'],
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },
    feedback: {
      type: String,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function (gradedBy: mongoose.Types.ObjectId) {
          if (!gradedBy) return true;
          const User = mongoose.model('User');
          const user = await User.findById(gradedBy);
          return (
            user &&
            (user.roles.includes('teacher') || user.roles.includes('admin'))
          );
        },
        message: 'Grader must be a valid teacher or admin',
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: [1, 'Attempt number must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: ['submitted', 'graded', 'late', 'overdue'],
        message: 'Status must be submitted, graded, late, or overdue',
      },
      default: 'submitted',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
submissionSchema.index({ assignmentId: 1, studentId: 1 });
submissionSchema.index({ studentId: 1 });
submissionSchema.index({ courseId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ gradedAt: -1 });

// Virtual for assignment
submissionSchema.virtual('assignment', {
  ref: 'Assignment',
  localField: 'assignmentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for student
submissionSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
submissionSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for grader
submissionSchema.virtual('grader', {
  ref: 'User',
  localField: 'gradedBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for percentage score
submissionSchema.virtual('percentageScore').get(function () {
  if (!this.score) return null;
  return `${this.score}%`;
});

// Virtual for grade letter
submissionSchema.virtual('gradeLetter').get(function () {
  if (!this.score) return 'N/A';

  if (this.score >= 90) return 'A';
  if (this.score >= 80) return 'B';
  if (this.score >= 70) return 'C';
  if (this.score >= 60) return 'D';
  return 'F';
});

// Virtual for isGraded
submissionSchema.virtual('isGraded').get(function () {
  return this.status === 'graded';
});

// Virtual for timeSinceSubmission
submissionSchema.virtual('timeSinceSubmission').get(function () {
  const now = new Date();
  const submitted = new Date(this.submittedAt);
  const diff = now.getTime() - submitted.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Pre-save middleware to set status and isLate
submissionSchema.pre('save', async function (next) {
  if (this.isModified('submittedAt') || this.isNew) {
    try {
      const Assignment = mongoose.model('Assignment');
      const assignment = await Assignment.findById(this.assignmentId);

      if (assignment && assignment.dueDate) {
        const dueDate = new Date(assignment.dueDate);
        const submittedDate = new Date(this.submittedAt);

        if (submittedDate > dueDate) {
          this.isLate = true;
          this.status = 'late';
        }
      }
    } catch (error) {
      console.error('Error checking assignment due date:', error);
    }
  }

  if (this.isModified('score') && this.score !== undefined) {
    this.status = 'graded';
    this.gradedAt = new Date();
  }

  next();
});

// Pre-save middleware to validate submission content
submissionSchema.pre('save', async function (next) {
  try {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignmentId);

    if (!assignment) {
      return next(new Error('Assignment not found'));
    }

    // Validate based on assignment type
    if (
      assignment.type === 'quiz' &&
      (!this.answers || this.answers.length === 0)
    ) {
      return next(new Error('Quiz submissions must include answers'));
    }

    if (assignment.type === 'file' && !this.fileUrl) {
      return next(new Error('File submissions must include a file'));
    }

    if (assignment.type === 'text' && !this.textAnswer) {
      return next(new Error('Text submissions must include a text answer'));
    }
  } catch (error) {
    return next(error as Error);
  }

  next();
});

// Static method to find by assignment
submissionSchema.statics.findByAssignment = function (
  assignmentId: mongoose.Types.ObjectId
) {
  return this.find({ assignmentId }).sort({ submittedAt: -1 });
};

// Static method to find by student
submissionSchema.statics.findByStudent = function (
  studentId: mongoose.Types.ObjectId
) {
  return this.find({ studentId }).sort({ submittedAt: -1 });
};

// Static method to find by course
submissionSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ submittedAt: -1 });
};

// Static method to find pending submissions
submissionSchema.statics.findPending = function () {
  return this.find({ status: 'submitted' }).sort({ submittedAt: 1 });
};

// Static method to find late submissions
submissionSchema.statics.findLate = function () {
  return this.find({ isLate: true }).sort({ submittedAt: -1 });
};

// Instance method to grade submission
submissionSchema.methods.grade = async function (
  score: number,
  feedback: string,
  gradedBy: mongoose.Types.ObjectId
) {
  this.score = score;
  this.feedback = feedback;
  this.gradedBy = gradedBy;
  this.status = 'graded';
  this.gradedAt = new Date();

  await this.save();

  // Update student stats
  try {
    const User = mongoose.model('User');
    const user = await User.findById(this.studentId);
    if (user) {
      const totalSubmissions = user.stats?.totalAssignmentsSubmitted || 0;
      const currentAverage = user.stats?.averageScore || 0;

      // Calculate new average
      const newAverage =
        totalSubmissions > 0
          ? (currentAverage * totalSubmissions + score) / (totalSubmissions + 1)
          : score;

      await User.findByIdAndUpdate(this.studentId, {
        $inc: { 'stats.totalAssignmentsSubmitted': 1 },
        $set: { 'stats.averageScore': newAverage },
      });
    }
  } catch (error) {
    console.error('Error updating student stats:', error);
  }
};

// Export the model
export default mongoose.model<ISubmission>('Submission', submissionSchema);
