import mongoose, { Document, Schema } from 'mongoose';

// Wishlist interface
export interface IWishlist extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  addedAt: Date;
  notes?: string;
}

// Wishlist schema
const wishlistSchema = new Schema<IWishlist>(
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
    addedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index for student-course combination
wishlistSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Other indexes for performance
wishlistSchema.index({ addedAt: -1 });

// Virtual for student
wishlistSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
wishlistSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Static method to find by student
wishlistSchema.statics.findByStudent = function (
  studentId: mongoose.Types.ObjectId
) {
  return this.find({ studentId }).sort({ addedAt: -1 });
};

// Static method to find by course
wishlistSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId }).sort({ addedAt: -1 });
};

// Static method to check if course is in wishlist
wishlistSchema.statics.isInWishlist = function (
  studentId: mongoose.Types.ObjectId,
  courseId: mongoose.Types.ObjectId
) {
  return this.exists({ studentId, courseId });
};

// Export the model
export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
