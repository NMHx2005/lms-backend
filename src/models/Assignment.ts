import mongoose, { Document, Schema } from 'mongoose';

// Assignment interface
export interface IAssignment extends Document {
  lessonId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  instructions: string;
  type: 'file' | 'quiz' | 'text';
  dueDate?: Date;
  maxScore: number;
  timeLimit?: number;
  attempts: number;
  isRequired: boolean;
  isGraded: boolean;
  gradingCriteria: string[];
  importantNotes: string[];
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  quizQuestions?: {
    question: string;
    type: 'multiple-choice' | 'text' | 'file';
    options?: string[];
    correctAnswer?: string;
    points: number;
    required: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Assignment schema
const assignmentSchema = new Schema<IAssignment>(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    instructions: {
      type: String,
      required: [true, 'Assignment instructions are required'],
      trim: true,
      maxlength: [1000, 'Instructions cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Assignment type is required'],
      enum: {
        values: ['file', 'quiz', 'text'],
        message: 'Assignment type must be file, quiz, or text',
      },
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          return !date || date > new Date();
        },
        message: 'Due date cannot be in the past',
      },
    },
    maxScore: {
      type: Number,
      required: [true, 'Maximum score is required'],
      min: [1, 'Maximum score must be at least 1'],
      max: [100, 'Maximum score cannot exceed 100'],
    },
    timeLimit: {
      type: Number,
      min: [1, 'Time limit must be at least 1 minute'],
      max: [1440, 'Time limit cannot exceed 24 hours (1440 minutes)'],
    },
    attempts: {
      type: Number,
      default: 1,
      min: [1, 'Attempts must be at least 1'],
      max: [10, 'Attempts cannot exceed 10'],
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    isGraded: {
      type: Boolean,
      default: true,
    },
    gradingCriteria: {
      type: [String],
      default: [],
      validate: {
        validator: function (criteria: string[]) {
          return criteria.every(c => c.length <= 200);
        },
        message: 'Each grading criterion cannot exceed 200 characters',
      },
    },
    importantNotes: {
      type: [String],
      default: [],
      validate: {
        validator: function (notes: string[]) {
          return notes.every(note => note.length <= 200);
        },
        message: 'Each important note cannot exceed 200 characters',
      },
    },
    attachments: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
          min: 0,
        },
        type: {
          type: String,
          required: true,
        },
      },
    ],
    quizQuestions: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, 'Question cannot exceed 500 characters'],
        },
        type: {
          type: String,
          required: true,
          enum: {
            values: ['multiple-choice', 'text', 'file'],
            message: 'Question type must be multiple-choice, text, or file',
          },
        },
        options: {
          type: [String],
          validate: {
            validator: function (this: any, options: string[]) {
              return (
                this.type !== 'multiple-choice' ||
                (options && options.length >= 2)
              );
            },
            message: 'Multiple choice questions must have at least 2 options',
          },
        },
        correctAnswer: {
          type: String,
          validate: {
            validator: function (this: any, answer: string) {
              return this.type !== 'multiple-choice' || answer;
            },
            message: 'Correct answer is required for multiple choice questions',
          },
        },
        points: {
          type: Number,
          required: true,
          min: [1, 'Points must be at least 1'],
          max: [100, 'Points cannot exceed 100'],
        },
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
assignmentSchema.index({ lessonId: 1 });
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ type: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ isRequired: 1 });
assignmentSchema.index({ createdAt: -1 });

// Virtual for lesson
assignmentSchema.virtual('lesson', {
  ref: 'Lesson',
  localField: 'lessonId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
assignmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for submissions
assignmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignmentId',
});

// Virtual for total submissions
assignmentSchema.virtual('totalSubmissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignmentId',
  count: true,
});

// Virtual for isOverdue
assignmentSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Virtual for timeRemaining
assignmentSchema.virtual('timeRemaining').get(function () {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diff = due.getTime() - now.getTime();

  if (diff <= 0) return 0;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

// Pre-save middleware to validate quiz questions
assignmentSchema.pre('save', function (next) {
  if (
    this.type === 'quiz' &&
    (!this.quizQuestions || this.quizQuestions.length === 0)
  ) {
    return next(new Error('Quiz assignments must have at least one question'));
  }

  if (this.type === 'quiz') {
    const totalPoints = this.quizQuestions!.reduce(
      (sum, q) => sum + q.points,
      0
    );
    if (totalPoints !== this.maxScore) {
      return next(
        new Error(
          `Total question points (${totalPoints}) must equal maximum score (${this.maxScore})`
        )
      );
    }
  }

  next();
});

// Static method to find by lesson
assignmentSchema.statics.findByLesson = function (
  lessonId: mongoose.Types.ObjectId
) {
  return this.find({ lessonId }).sort({ createdAt: -1 });
};

// Static method to find by course
assignmentSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ createdAt: -1 });
};

// Static method to find overdue assignments
assignmentSchema.statics.findOverdue = function () {
  return this.find({ dueDate: { $lt: new Date() } });
};

// Static method to find by type
assignmentSchema.statics.findByType = function (type: string) {
  return this.find({ type });
};

// Instance method to check if student can submit
assignmentSchema.methods.canSubmit = function (
  studentId: mongoose.Types.ObjectId,
  currentAttempts: number
): boolean {
  if (this.isOverdue) return false;
  if (currentAttempts >= this.attempts) return false;
  return true;
};

// Export the model
export default mongoose.model<IAssignment>('Assignment', assignmentSchema);
