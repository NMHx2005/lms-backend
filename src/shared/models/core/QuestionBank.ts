import mongoose, { Document, Schema } from 'mongoose';

// Question Bank interface
export interface IQuestionBank extends Document {
  teacherId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId; // Optional: can be shared across courses
  question: string;
  type: 'multiple-choice' | 'true-false' | 'multiple-select' | 'fill-blank' | 'short-answer' | 'matching' | 'ordering' | 'essay';
  answers: string[];
  correctAnswer: any; // Support all types
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[]; // Topics, subjects, etc.
  topic?: string;
  subject?: string;
  bloomLevel?: string; // Bloom's taxonomy level
  isPublic: boolean; // Can be shared with other teachers
  usageCount: number; // How many times used in quizzes
  createdAt: Date;
  updatedAt: Date;
}

// Question Bank schema
const questionBankSchema = new Schema<IQuestionBank>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      maxlength: [1000, 'Question cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'multiple-select', 'fill-blank', 'short-answer', 'matching', 'ordering', 'essay'],
      required: [true, 'Question type is required'],
    },
    answers: {
      type: [String],
      required: [true, 'Answers are required'],
      validate: {
        validator: function (answers: string[]) {
          return answers.length >= 2;
        },
        message: 'At least 2 answers are required',
      },
    },
    correctAnswer: {
      type: Schema.Types.Mixed,
      required: [true, 'Correct answer is required'],
    },
    explanation: {
      type: String,
      maxlength: [2000, 'Explanation cannot exceed 2000 characters'],
    },
    points: {
      type: Number,
      required: true,
      min: [1, 'Points must be at least 1'],
      max: [100, 'Points cannot exceed 100'],
      default: 10,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: {
      type: [String],
      default: [],
    },
    topic: {
      type: String,
      maxlength: [100, 'Topic cannot exceed 100 characters'],
    },
    subject: {
      type: String,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    bloomLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
questionBankSchema.index({ teacherId: 1 });
questionBankSchema.index({ courseId: 1 });
questionBankSchema.index({ type: 1 });
questionBankSchema.index({ difficulty: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ topic: 1 });
questionBankSchema.index({ subject: 1 });
questionBankSchema.index({ isPublic: 1 });
questionBankSchema.index({ createdAt: -1 });

// Text index for search
questionBankSchema.index({ question: 'text', explanation: 'text', tags: 'text' });

export const QuestionBank = mongoose.model<IQuestionBank>('QuestionBank', questionBankSchema);
