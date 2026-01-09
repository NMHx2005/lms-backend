import mongoose, { Document, Schema } from 'mongoose';

// Quiz Attempt interface
export interface IQuizAttempt extends Document {
  lessonId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  attemptNumber: number;
  answers: Array<{
    questionIndex: number;
    answer: any;
    isCorrect: boolean;
    points: number;
  }>;
  score: number;
  totalPoints: number;
  percentage: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  timeSpent: number; // in seconds
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz Attempt schema
const quizAttemptSchema = new Schema<IQuizAttempt>(
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
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: [1, 'Attempt number must be at least 1'],
    },
    answers: [{
      questionIndex: { type: Number, required: true },
      answer: { type: Schema.Types.Mixed, required: true },
      isCorrect: { type: Boolean, required: true },
      points: { type: Number, required: true, min: 0 }
    }],
    score: {
      type: Number,
      required: true,
      min: [0, 'Score cannot be negative'],
    },
    totalPoints: {
      type: Number,
      required: true,
      min: [0, 'Total points cannot be negative'],
    },
    percentage: {
      type: Number,
      required: true,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    correct: {
      type: Number,
      required: true,
      min: [0, 'Correct count cannot be negative'],
    },
    incorrect: {
      type: Number,
      required: true,
      min: [0, 'Incorrect count cannot be negative'],
    },
    unanswered: {
      type: Number,
      required: true,
      min: [0, 'Unanswered count cannot be negative'],
    },
    timeSpent: {
      type: Number,
      required: true,
      min: [0, 'Time spent cannot be negative'],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
quizAttemptSchema.index({ lessonId: 1, studentId: 1, attemptNumber: 1 });
quizAttemptSchema.index({ studentId: 1 });
quizAttemptSchema.index({ courseId: 1 });
quizAttemptSchema.index({ submittedAt: -1 });

// Compound unique index to prevent duplicate attempts
quizAttemptSchema.index({ lessonId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
