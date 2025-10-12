import mongoose, { Document, Schema } from 'mongoose';

// Lesson interface
export interface ILesson extends Document {
  sectionId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'video' | 'text' | 'file' | 'link' | 'quiz' | 'assignment';
  videoUrl?: string;
  videoDuration?: number;
  videoThumbnail?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  externalLink?: string;
  // Quiz fields
  quizQuestions?: {
    question: string;
    answers: string[];
    correctAnswer: number; // Index of correct answer (0-based)
    explanation?: string;
  }[];
  // Assignment fields
  assignmentDetails?: {
    instructions: string;
    dueDate?: Date;
    maxScore?: number;
    allowLateSubmission?: boolean;
  };
  order: number;
  isRequired: boolean;
  isPreview: boolean;
  isVisible: boolean;
  isPublished: boolean;
  estimatedTime: number;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Lesson schema
const lessonSchema = new Schema<ILesson>(
  {
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section ID is required'],
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
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: any, content: string) {
          // Content is required for text and assignment types only
          // Quiz uses quizQuestions instead
          const typesNeedingContent = ['text', 'assignment'];
          if (typesNeedingContent.includes(this.type) && !content) {
            return false;
          }
          return true;
        },
        message: 'Content is required for text and assignment lessons'
      }
    },
    type: {
      type: String,
      required: [true, 'Lesson type is required'],
      enum: {
        values: ['video', 'text', 'file', 'link', 'quiz', 'assignment'],
        message: 'Lesson type must be video, text, file, link, quiz, or assignment',
      },
    },
    videoUrl: {
      type: String,
      validate: {
        validator: function (this: any, url: string) {
          // VideoUrl is required for 'video' type lessons
          if (this.type === 'video' && !url) {
            return false;
          }
          return true;
        },
        message: 'Video URL is required for video lessons'
      }
    },
    videoDuration: {
      type: Number,
      min: [0, 'Video duration cannot be negative'],
    },
    videoThumbnail: {
      type: String,
    },
    fileUrl: {
      type: String,
      validate: {
        validator: function (this: any, url: string) {
          // FileUrl is required for 'file' type lessons
          if (this.type === 'file' && !url) {
            return false;
          }
          return true;
        },
        message: 'File URL is required for file lessons'
      }
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
    },
    fileType: {
      type: String,
    },
    externalLink: {
      type: String,
    },
    // Quiz questions
    quizQuestions: {
      type: [{
        question: { type: String, required: true },
        answers: { type: [String], required: true },
        correctAnswer: { type: Number, required: true },
        explanation: { type: String }
      }],
      default: [],
      validate: {
        validator: function (this: any, questions: any[]) {
          // Quiz lessons must have at least 1 question
          if (this.type === 'quiz' && (!questions || questions.length === 0)) {
            return false;
          }
          return true;
        },
        message: 'Quiz lessons must have at least one question'
      }
    },
    // Assignment details
    assignmentDetails: {
      type: {
        instructions: { type: String },
        dueDate: { type: Date },
        maxScore: { type: Number },
        allowLateSubmission: { type: Boolean, default: false }
      },
      default: undefined
    },
    order: {
      type: Number,
      required: [true, 'Lesson order is required'],
      min: [1, 'Order must be at least 1'],
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    estimatedTime: {
      type: Number,
      required: [true, 'Estimated time is required'],
      min: [1, 'Estimated time must be at least 1 minute'],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
lessonSchema.index({ sectionId: 1, order: 1 });
lessonSchema.index({ courseId: 1 });
lessonSchema.index({ type: 1 });
lessonSchema.index({ isPreview: 1 });
lessonSchema.index({ isVisible: 1 });
lessonSchema.index({ isPublished: 1 });
lessonSchema.index({ sectionId: 1, isVisible: 1 });
lessonSchema.index({ createdAt: -1 });

// Virtual for section
lessonSchema.virtual('section', {
  ref: 'Section',
  localField: 'sectionId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
lessonSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for assignments
lessonSchema.virtual('assignments', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'lessonId',
});

// Pre-save middleware to update section stats
lessonSchema.pre('save', async function (next) {
  if (this.isModified('videoDuration')) {
    try {
      const Section = mongoose.model('Section');
      const section = await Section.findById(this.sectionId);
      if (section) {
        await section.updateDuration();
      }
    } catch (error) {
      console.error('Error updating section duration:', error);
    }
  }
  next();
});

// Pre-save middleware to validate content based on type
lessonSchema.pre('save', function (next) {
  if (this.type === 'video' && !this.videoUrl) {
    return next(new Error('Video URL is required for video lessons'));
  }
  if (this.type === 'file' && !this.fileUrl) {
    return next(new Error('File URL is required for file lessons'));
  }
  if (this.type === 'link' && !this.externalLink) {
    return next(new Error('External link is required for link lessons'));
  }
  next();
});

// Static method to find by section
lessonSchema.statics.findBySection = function (
  sectionId: mongoose.Types.ObjectId
) {
  return this.find({ sectionId }).sort({ order: 1 });
};

// Static method to find by course
lessonSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ order: 1 });
};

// Static method to find preview lessons
lessonSchema.statics.findPreview = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId, isPreview: true }).sort({ order: 1 });
};

// Instance method to get formatted duration
lessonSchema.methods.getFormattedDuration = function (): string {
  if (!this.videoDuration) return 'N/A';

  const hours = Math.floor(this.videoDuration / 3600);
  const minutes = Math.floor((this.videoDuration % 3600) / 60);
  const seconds = this.videoDuration % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Export the model
export default mongoose.model<ILesson>('Lesson', lessonSchema);
