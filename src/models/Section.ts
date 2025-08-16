import mongoose, { Document, Schema } from 'mongoose';

// Section interface
export interface ISection extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  isVisible: boolean;
  totalLessons: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Section schema
const sectionSchema = new Schema<ISection>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Section order is required'],
      min: [1, 'Order must be at least 1'],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
sectionSchema.index({ courseId: 1, order: 1 });
sectionSchema.index({ courseId: 1, isVisible: 1 });
sectionSchema.index({ createdAt: -1 });

// Virtual for lessons
sectionSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'sectionId',
  options: { sort: { order: 1 } },
});

// Virtual for course
sectionSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to update course stats
sectionSchema.pre('save', async function (next) {
  if (this.isModified('totalLessons') || this.isModified('totalDuration')) {
    try {
      const Course = mongoose.model('Course');
      await Course.findByIdAndUpdate(this.courseId, {
        $set: {
          totalLessons: await mongoose
            .model('Section')
            .aggregate([
              { $match: { courseId: this.courseId } },
              { $group: { _id: null, total: { $sum: '$totalLessons' } } },
            ])
            .then(result => result[0]?.total || 0),
          totalDuration: await mongoose
            .model('Section')
            .aggregate([
              { $match: { courseId: this.courseId } },
              { $group: { _id: null, total: { $sum: '$totalDuration' } } },
            ])
            .then(result => result[0]?.total || 0),
        },
      });
    } catch (error) {
      console.error('Error updating course stats:', error);
    }
  }
  next();
});

// Static method to find by course
sectionSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId, isVisible: true }).sort({ order: 1 });
};

// Static method to find visible sections
sectionSchema.statics.findVisible = function () {
  return this.find({ isVisible: true });
};

// Instance method to update lesson count
sectionSchema.methods.updateLessonCount = async function () {
  const Lesson = mongoose.model('Lesson');
  const lessonCount = await Lesson.countDocuments({ sectionId: this._id });
  this.totalLessons = lessonCount;
  await this.save();
};

// Instance method to update duration
sectionSchema.methods.updateDuration = async function () {
  const Lesson = mongoose.model('Lesson');
  const result = await Lesson.aggregate([
    { $match: { sectionId: this._id } },
    { $group: { _id: null, total: { $sum: '$videoDuration' } } },
  ]);
  this.totalDuration = result[0]?.total || 0;
  await this.save();
};

// Export the model
export default mongoose.model<ISection>('Section', sectionSchema);
