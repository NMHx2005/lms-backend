import mongoose, { Document, Schema } from 'mongoose';

// Enrollment interface
export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  instructorId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number;
  currentLesson?: mongoose.Types.ObjectId;
  currentSection?: mongoose.Types.ObjectId;
  totalTimeSpent: number;
  lastActivityAt?: Date;
  isActive: boolean;
  isCompleted: boolean;
  certificateIssued: boolean;
  certificateUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enrollment schema
const enrollmentSchema = new Schema<IEnrollment>(
  {
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
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor ID is required'],
      index: true,
    },
    enrolledAt: {
      type: Date,
      required: [true, 'Enrollment date is required'],
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
    },
    currentLesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    currentSection: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: [0, 'Total time spent cannot be negative'],
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateUrl: {
      type: String,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index for student-course combination
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Other indexes for performance
enrollmentSchema.index({ instructorId: 1 });
enrollmentSchema.index({ isActive: 1 });
enrollmentSchema.index({ isCompleted: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ lastActivityAt: -1 });
enrollmentSchema.index({ progress: -1 });

// Virtual for student
enrollmentSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
enrollmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for instructor
enrollmentSchema.virtual('instructor', {
  ref: 'User',
  localField: 'instructorId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for current lesson details
enrollmentSchema.virtual('currentLessonDetails', {
  ref: 'Lesson',
  localField: 'currentLesson',
  foreignField: '_id',
  justOne: true,
});

// Virtual for current section details
enrollmentSchema.virtual('currentSectionDetails', {
  ref: 'Section',
  localField: 'currentSection',
  foreignField: '_id',
  justOne: true,
});

// Virtual for enrollment duration
enrollmentSchema.virtual('enrollmentDuration').get(function () {
  let now: Date;
  if (this.isCompleted && this.completedAt) {
    now = new Date(this.completedAt);
  } else {
    now = new Date();
  }
  const enrolled = new Date(this.enrolledAt);
  const diff = now.getTime() - enrolled.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Less than 1h';
});

// Virtual for time since last activity
enrollmentSchema.virtual('timeSinceLastActivity').get(function () {
  const now = new Date();
  const lastActivity = new Date(this.lastActivityAt || this.enrolledAt);
  const diff = now.getTime() - lastActivity.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Virtual for progress status
enrollmentSchema.virtual('progressStatus').get(function () {
  if (this.progress === 0) return 'Not Started';
  if (this.progress < 25) return 'Just Started';
  if (this.progress < 50) return 'In Progress';
  if (this.progress < 75) return 'Halfway';
  if (this.progress < 100) return 'Almost Done';
  return 'Completed';
});

// Pre-save middleware to update progress
enrollmentSchema.pre('save', function (next) {
  if (
    this.isModified('progress') &&
    this.progress >= 100 &&
    !this.isCompleted
  ) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }

  if (this.isModified('isCompleted') && this.isCompleted) {
    this.progress = 100;
  }

  next();
});

// Pre-save middleware to update last activity
enrollmentSchema.pre('save', function (next) {
  this.lastActivityAt = new Date();
  next();
});

// Pre-save middleware to validate instructor
enrollmentSchema.pre('save', async function (next) {
  if (this.isModified('instructorId')) {
    try {
      const User = mongoose.model('User');
      const instructor = await User.findById(this.instructorId);
      if (!instructor || !instructor.roles.includes('teacher')) {
        return next(new Error('Instructor must be a valid teacher'));
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Static method to find by student
enrollmentSchema.statics.findByStudent = function (
  studentId: mongoose.Types.ObjectId
) {
  return this.find({ studentId, isActive: true }).sort({ enrolledAt: -1 });
};

// Static method to find by course
enrollmentSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId, isActive: true }).sort({ enrolledAt: -1 });
};

// Static method to find by instructor
enrollmentSchema.statics.findByInstructor = function (
  instructorId: mongoose.Types.ObjectId
) {
  return this.find({ instructorId, isActive: true }).sort({ enrolledAt: -1 });
};

// Static method to find active enrollments
enrollmentSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find completed enrollments
enrollmentSchema.statics.findCompleted = function () {
  return this.find({ isCompleted: true });
};

// Instance method to update progress
enrollmentSchema.methods.updateProgress = async function (progress: number) {
  this.progress = Math.min(100, Math.max(0, progress));

  if (this.progress >= 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }

  await this.save();
};

// Instance method to update current lesson
enrollmentSchema.methods.updateCurrentLesson = async function (
  lessonId: mongoose.Types.ObjectId
) {
  this.currentLesson = lessonId;
  this.lastActivityAt = new Date();
  await this.save();
};

// Instance method to update current section
enrollmentSchema.methods.updateCurrentSection = async function (
  sectionId: mongoose.Types.ObjectId
) {
  this.currentSection = sectionId;
  this.lastActivityAt = new Date();
  await this.save();
};

// Instance method to add time spent
enrollmentSchema.methods.addTimeSpent = async function (seconds: number) {
  this.totalTimeSpent += seconds;
  this.lastActivityAt = new Date();
  await this.save();
};

// Export the model
export default mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
