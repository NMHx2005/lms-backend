import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonProgress extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  isCompleted: boolean;
  timeSpentSeconds: number;
  firstAccessedAt?: Date;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    isCompleted: { type: Boolean, default: false, index: true },
    timeSpentSeconds: { type: Number, default: 0, min: 0 },
    firstAccessedAt: { type: Date },
    lastAccessedAt: { type: Date },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ studentId: 1, courseId: 1, sectionId: 1 });

lessonProgressSchema.methods.addTime = async function (seconds: number) {
  this.timeSpentSeconds += Math.max(0, seconds || 0);
  this.lastAccessedAt = new Date();
  if (!this.firstAccessedAt) this.firstAccessedAt = new Date();
  await this.save();
};

lessonProgressSchema.methods.markCompleted = async function () {
  this.isCompleted = true;
  this.lastAccessedAt = new Date();
  if (!this.firstAccessedAt) this.firstAccessedAt = new Date();
  await this.save();
};

export default mongoose.model<ILessonProgress>('LessonProgress', lessonProgressSchema);


