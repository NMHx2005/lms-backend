import mongoose, { Document, Schema } from 'mongoose';

// CourseRating interface
export interface ICourseRating extends Document {
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'upvote' | 'report';
  rating?: number;
  comment?: string;
  reportReason?: string;
  isAnonymous: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// CourseRating schema
const courseRatingSchema = new Schema<ICourseRating>(
  {
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
    type: {
      type: String,
      required: [true, 'Rating type is required'],
      enum: {
        values: ['upvote', 'report'],
        message: 'Rating type must be upvote or report',
      },
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: function (this: any, rating: number) {
          return this.type !== 'upvote' || (rating >= 1 && rating <= 5);
        },
        message: 'Rating is required for upvotes and must be between 1-5',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    reportReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Report reason cannot exceed 500 characters'],
      validate: {
        validator: function (this: any, reason: string): boolean {
          return this.type !== 'report' || !!reason;
        },
        message: 'Report reason is required for reports',
      },
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isVerified: {
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

// Compound unique index for student-course combination
courseRatingSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Other indexes for performance
courseRatingSchema.index({ type: 1 });
courseRatingSchema.index({ rating: 1 });
courseRatingSchema.index({ isVerified: 1 });
courseRatingSchema.index({ createdAt: -1 });

// Virtual for course
courseRatingSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for student
courseRatingSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for rating stars
courseRatingSchema.virtual('ratingStars').get(function () {
  if (!this.rating) return '';
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Virtual for type label
courseRatingSchema.virtual('typeLabel').get(function () {
  return this.type === 'upvote' ? 'Upvote' : 'Report';
});

// Virtual for time since creation
courseRatingSchema.virtual('timeSinceCreation').get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diff = now.getTime() - created.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ago`;
  if (hours > 0) return `${hours}h ${minutes}m ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Pre-save middleware to validate rating type
courseRatingSchema.pre('save', function (next) {
  if (this.type === 'upvote' && !this.rating) {
    return next(new Error('Rating is required for upvotes'));
  }

  if (this.type === 'report' && !this.reportReason) {
    return next(new Error('Report reason is required for reports'));
  }

  next();
});

// Pre-save middleware to update course stats
courseRatingSchema.pre('save', async function (next) {
  try {
    const Course = mongoose.model('Course');

    if (this.type === 'upvote') {
      // Update upvotes count
      await Course.findByIdAndUpdate(this.courseId, {
        $inc: { upvotes: 1 },
      });

      // Update average rating
      const course = await Course.findById(this.courseId);
      if (course) {
        const totalRatings = course.totalRatings + 1;
        const newAverage =
          (course.averageRating * course.totalRatings + this.rating!) /
          totalRatings;

        await Course.findByIdAndUpdate(this.courseId, {
          $set: {
            averageRating: newAverage,
            totalRatings: totalRatings,
          },
        });
      }
    } else if (this.type === 'report') {
      // Update reports count
      await Course.findByIdAndUpdate(this.courseId, {
        $inc: { reports: 1 },
      });
    }
  } catch (error) {

  }

  next();
});

// Static method to find by course
courseRatingSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ createdAt: -1 });
};

// Static method to find by student
courseRatingSchema.statics.findByStudent = function (
  studentId: mongoose.Types.ObjectId
) {
  return this.find({ studentId }).sort({ createdAt: -1 });
};

// Static method to find by type
courseRatingSchema.statics.findByType = function (type: string) {
  return this.find({ type }).sort({ createdAt: -1 });
};

// Static method to find upvotes
courseRatingSchema.statics.findUpvotes = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId, type: 'upvote' }).sort({ createdAt: -1 });
};

// Static method to find reports
courseRatingSchema.statics.findReports = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId, type: 'report' }).sort({ createdAt: -1 });
};

// Static method to find verified ratings
courseRatingSchema.statics.findVerified = function () {
  return this.find({ isVerified: true }).sort({ createdAt: -1 });
};

// Instance method to verify rating
courseRatingSchema.methods.verify = async function () {
  this.isVerified = true;
  await this.save();
};

// Instance method to unverify rating
courseRatingSchema.methods.unverify = async function () {
  this.isVerified = false;
  await this.save();
};

// Export the model
export default mongoose.model<ICourseRating>(
  'CourseRating',
  courseRatingSchema
);
