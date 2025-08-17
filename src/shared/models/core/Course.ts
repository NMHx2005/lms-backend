import mongoose, { Document, Schema } from 'mongoose';

// Course interface
export interface ICourse extends Document {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  domain: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  benefits: string[];
  relatedLinks: string[];
  instructorId: mongoose.Types.ObjectId;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isPublished: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  upvotes: number;
  reports: number;
  enrolledStudents: mongoose.Types.ObjectId[];
  totalStudents: number;
  totalLessons: number;
  totalDuration: number;
  averageRating: number;
  totalRatings: number;
  completionRate: number;
  tags: string[];
  language: string;
  certificate: boolean;
  maxStudents?: number;
  startDate?: Date;
  endDate?: Date;
  publishedAt?: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Course schema
const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    thumbnail: {
      type: String,
      default: null,
    },
    domain: {
      type: String,
      required: [true, 'Course domain is required'],
      trim: true,
      enum: {
        values: [
          'IT',
          'Economics',
          'Law',
          'Marketing',
          'Design',
          'Language',
          'Science',
          'Arts',
          'Business',
          'Other',
        ],
        message: 'Please select a valid domain',
      },
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Please select a valid level',
      },
    },
    prerequisites: {
      type: [String],
      default: [],
      validate: {
        validator: function (prereqs: string[]) {
          return prereqs.every(prereq => prereq.length <= 200);
        },
        message: 'Each prerequisite cannot exceed 200 characters',
      },
    },
    benefits: {
      type: [String],
      default: [],
      validate: {
        validator: function (benefits: string[]) {
          return benefits.every(benefit => benefit.length <= 200);
        },
        message: 'Each benefit cannot exceed 200 characters',
      },
    },
    relatedLinks: {
      type: [String],
      default: [],
      validate: {
        validator: function (links: string[]) {
          return links.every(link => link.length <= 500);
        },
        message: 'Each link cannot exceed 500 characters',
      },
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor is required'],
      validate: {
        validator: async function (instructorId: mongoose.Types.ObjectId) {
          const User = mongoose.model('User');
          const user = await User.findById(instructorId);
          return user && user.roles.includes('teacher');
        },
        message: 'Instructor must be a valid teacher',
      },
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
      max: [10000000, 'Price cannot exceed 10,000,000 VND'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      validate: {
        validator: function (this: any, originalPrice: number) {
          return !originalPrice || originalPrice >= this.price;
        },
        message:
          'Original price must be greater than or equal to current price',
      },
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%'],
      validate: {
        validator: function (this: any, discount: number) {
          if (!discount) return true;
          if (!this.originalPrice) return false;
          const calculatedPrice = this.originalPrice * (1 - discount / 100);
          return Math.abs(calculatedPrice - this.price) < 1000; // Allow 1000 VND difference
        },
        message: 'Discount percentage does not match price calculation',
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    reports: {
      type: Number,
      default: 0,
      min: 0,
    },
    enrolledStudents: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    totalStudents: {
      type: Number,
      default: 0,
      min: 0,
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
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.every(tag => tag.length <= 50);
        },
        message: 'Each tag cannot exceed 50 characters',
      },
    },
    language: {
      type: String,
      default: 'vi',
      enum: ['vi', 'en', 'ja', 'ko', 'zh'],
    },
    certificate: {
      type: Boolean,
      default: false,
    },
    maxStudents: {
      type: Number,
      min: [1, 'Maximum students must be at least 1'],
      max: [10000, 'Maximum students cannot exceed 10,000'],
    },
    startDate: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          return !date || date >= new Date();
        },
        message: 'Start date cannot be in the past',
      },
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: any, date: Date) {
          return !date || !this.startDate || date > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function (adminId: mongoose.Types.ObjectId) {
          if (!adminId) return true;
          const User = mongoose.model('User');
          const user = await User.findById(adminId);
          return user && user.roles.includes('admin');
        },
        message: 'Approver must be a valid admin',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
courseSchema.index({ instructorId: 1 });
courseSchema.index({ domain: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1, isApproved: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ isFeatured: 1, isPublished: 1, isApproved: 1 });
courseSchema.index({ enrolledStudents: 1 });
courseSchema.index({ averageRating: -1, totalRatings: -1 });

// Virtual for discount amount
courseSchema.virtual('discountAmount').get(function () {
  if (!this.originalPrice || !this.discountPercentage) return 0;
  return this.originalPrice - this.price;
});

// Virtual for isDiscounted
courseSchema.virtual('isDiscounted').get(function () {
  return !!(this.originalPrice && this.discountPercentage);
});

// Virtual for status
courseSchema.virtual('status').get(function () {
  if (!this.isApproved) return 'pending';
  if (!this.isPublished) return 'approved';
  return 'published';
});

// Virtual for canEnroll
courseSchema.virtual('canEnroll').get(function () {
  if (!this.isPublished || !this.isApproved) return false;
  if (this.maxStudents && this.totalStudents >= this.maxStudents) return false;
  return true;
});

// Pre-save middleware to update timestamps
courseSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  // Update publishedAt when publishing
  if (this.isModified('isPublished') && this.isPublished) {
    this.publishedAt = new Date();
  }

  // Update approvedAt when approving
  if (this.isModified('isApproved') && this.isApproved) {
    this.approvedAt = new Date();
  }

  next();
});

// Pre-save middleware to validate instructor
courseSchema.pre('save', async function (next) {
  if (this.isModified('instructorId')) {
    const User = mongoose.model('User');
    const instructor = await User.findById(this.instructorId);
    if (!instructor || !instructor.roles.includes('teacher')) {
      return next(new Error('Instructor must be a valid teacher'));
    }
  }
  next();
});

// Static method to find published courses
courseSchema.statics.findPublished = function () {
  return this.find({ isPublished: true, isApproved: true });
};

// Static method to find by domain
courseSchema.statics.findByDomain = function (domain: string) {
  return this.find({ domain, isPublished: true, isApproved: true });
};

// Static method to find by level
courseSchema.statics.findByLevel = function (level: string) {
  return this.find({ level, isPublished: true, isApproved: true });
};

// Static method to find featured courses
courseSchema.statics.findFeatured = function () {
  return this.find({ isFeatured: true, isPublished: true, isApproved: true });
};

// Static method to search courses
courseSchema.statics.search = function (query: string) {
  return this.find(
    {
      $text: { $search: query },
      isPublished: true,
      isApproved: true,
    },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// Instance method to enroll student
courseSchema.methods.enrollStudent = async function (
  studentId: mongoose.Types.ObjectId
) {
  if (!this.canEnroll) {
    throw new Error('Course is not available for enrollment');
  }

  if (this.enrolledStudents.includes(studentId)) {
    throw new Error('Student is already enrolled');
  }

  this.enrolledStudents.push(studentId);
  this.totalStudents = this.enrolledStudents.length;
  await this.save();
};

// Instance method to unenroll student
courseSchema.methods.unenrollStudent = async function (
  studentId: mongoose.Types.ObjectId
) {
  const index = this.enrolledStudents.indexOf(studentId);
  if (index === -1) {
    throw new Error('Student is not enrolled');
  }

  this.enrolledStudents.splice(index, 1);
  this.totalStudents = this.enrolledStudents.length;
  await this.save();
};

// Export the model
export default mongoose.model<ICourse>('Course', courseSchema);
