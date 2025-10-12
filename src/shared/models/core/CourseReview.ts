import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseReview extends Document {
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  enrollmentId?: mongoose.Types.ObjectId;

  // Rating & Review Content
  rating: number; // 1-5 stars
  title: string;
  content: string;
  pros: string[];
  cons: string[];

  // Review Status
  status: 'published' | 'pending' | 'hidden' | 'deleted';
  isVerifiedPurchase: boolean;
  isAnonymous: boolean;
  isPublic: boolean; // Can be viewed by everyone (vs private - only visible to user)

  // Engagement Metrics
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  helpfulCount: number;
  reportCount: number;

  // User Interactions
  upvotedBy: mongoose.Types.ObjectId[];
  downvotedBy: mongoose.Types.ObjectId[];
  reportedBy: mongoose.Types.ObjectId[];
  helpfulBy: mongoose.Types.ObjectId[];

  // Admin Moderation
  moderatedBy?: {
    adminId: mongoose.Types.ObjectId;
    action: 'approved' | 'hidden' | 'deleted';
    reason?: string;
    moderatedAt: Date;
  };

  // Review Quality Metrics
  qualityScore: number; // 0-100 (calculated based on engagement, length, etc.)
  isHighlighted: boolean; // Featured review
  isFeatured: boolean; // Staff pick

  // Course Progress Context
  completionPercentage: number;
  completedAt?: Date;
  timeSpentInCourse: number; // minutes

  // Response from Teacher/Admin
  teacherResponse?: {
    userId: mongoose.Types.ObjectId;
    content: string;
    respondedAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  voteScore: number;
  helpfulPercentage: number;
  ageInDays: number;
  isEditable: boolean;

  // Instance methods
  upvote(userId: mongoose.Types.ObjectId): Promise<ICourseReview>;
  downvote(userId: mongoose.Types.ObjectId): Promise<ICourseReview>;
  markHelpful(userId: mongoose.Types.ObjectId): Promise<ICourseReview>;
  report(userId: mongoose.Types.ObjectId): Promise<ICourseReview>;
  updateVoteCounts(): void;
  calculateQualityScore(): number;
}

const courseReviewSchema = new Schema<ICourseReview>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  enrollmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Enrollment',
    index: true
  },

  // Rating & Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
    minlength: [10, 'Review content must be at least 10 characters'],
    maxlength: [2000, 'Review content cannot exceed 2000 characters']
  },
  pros: {
    type: [String],
    default: [],
    validate: {
      validator: function (pros: string[]) {
        return pros.every(pro => pro.length <= 200);
      },
      message: 'Each pro cannot exceed 200 characters'
    }
  },
  cons: {
    type: [String],
    default: [],
    validate: {
      validator: function (cons: string[]) {
        return cons.every(con => con.length <= 200);
      },
      message: 'Each con cannot exceed 200 characters'
    }
  },

  // Review Status
  status: {
    type: String,
    enum: ['published', 'pending', 'hidden', 'deleted'],
    default: 'published',
    index: true
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
    index: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },

  // Engagement Metrics
  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  downvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  reportCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // User Interactions
  upvotedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpfulBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Admin Moderation
  moderatedBy: {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['approved', 'hidden', 'deleted']
    },
    reason: String,
    moderatedAt: Date
  },

  // Review Quality Metrics
  qualityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  isHighlighted: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  // Course Progress Context
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedAt: Date,
  timeSpentInCourse: {
    type: Number,
    default: 0,
    min: 0
  },

  // Response from Teacher/Admin
  teacherResponse: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      maxlength: 1000
    },
    respondedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Indexes for performance
courseReviewSchema.index({ courseId: 1, userId: 1 }, { unique: true }); // One review per user per course
courseReviewSchema.index({ courseId: 1, status: 1, rating: -1 });
courseReviewSchema.index({ userId: 1, createdAt: -1 });
courseReviewSchema.index({ status: 1, qualityScore: -1 });
courseReviewSchema.index({ courseId: 1, isHighlighted: 1, qualityScore: -1 });
courseReviewSchema.index({ courseId: 1, isFeatured: 1 });
courseReviewSchema.index({ reportCount: -1, status: 1 }); // For moderation queue

// Virtual for vote score (upvotes - downvotes)
courseReviewSchema.virtual('voteScore').get(function () {
  return this.upvotes - this.downvotes;
});

// Virtual for helpful percentage
courseReviewSchema.virtual('helpfulPercentage').get(function () {
  return this.totalVotes > 0 ? Math.round((this.helpfulCount / this.totalVotes) * 100) : 0;
});

// Virtual for review age in days
courseReviewSchema.virtual('ageInDays').get(function () {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for is editable (within 24 hours)
courseReviewSchema.virtual('isEditable').get(function () {
  const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation <= 24 && this.status === 'published';
});

// Instance Methods
courseReviewSchema.methods.upvote = function (userId: mongoose.Types.ObjectId) {
  // Remove from downvotes if exists
  this.downvotedBy = this.downvotedBy.filter((id: any) => !id.equals(userId));

  // Toggle upvote
  const hasUpvoted = this.upvotedBy.some((id: any) => id.equals(userId));
  if (hasUpvoted) {
    this.upvotedBy = this.upvotedBy.filter((id: any) => !id.equals(userId));
    this.upvotes = Math.max(0, this.upvotes - 1);
  } else {
    this.upvotedBy.push(userId);
    this.upvotes += 1;
  }

  this.updateVoteCounts();
  return this.save();
};

courseReviewSchema.methods.downvote = function (userId: mongoose.Types.ObjectId) {
  // Remove from upvotes if exists
  this.upvotedBy = this.upvotedBy.filter((id: any) => !id.equals(userId));

  // Toggle downvote
  const hasDownvoted = this.downvotedBy.some((id: any) => id.equals(userId));
  if (hasDownvoted) {
    this.downvotedBy = this.downvotedBy.filter((id: any) => !id.equals(userId));
    this.downvotes = Math.max(0, this.downvotes - 1);
  } else {
    this.downvotedBy.push(userId);
    this.downvotes += 1;
  }

  this.updateVoteCounts();
  return this.save();
};

courseReviewSchema.methods.markHelpful = function (userId: mongoose.Types.ObjectId) {
  const hasMarked = this.helpfulBy.some((id: any) => id.equals(userId));
  if (hasMarked) {
    this.helpfulBy = this.helpfulBy.filter((id: any) => !id.equals(userId));
    this.helpfulCount = Math.max(0, this.helpfulCount - 1);
  } else {
    this.helpfulBy.push(userId);
    this.helpfulCount += 1;
  }

  this.updateVoteCounts();
  return this.save();
};

courseReviewSchema.methods.report = function (userId: mongoose.Types.ObjectId) {
  const hasReported = this.reportedBy.some((id: any) => id.equals(userId));
  if (!hasReported) {
    this.reportedBy.push(userId);
    this.reportCount += 1;

    // Auto-hide if too many reports
    if (this.reportCount >= 5 && this.status === 'published') {
      this.status = 'pending';
    }

    return this.save();
  }
  return Promise.resolve(this);
};

courseReviewSchema.methods.updateVoteCounts = function () {
  this.totalVotes = this.upvotes + this.downvotes;
};

courseReviewSchema.methods.calculateQualityScore = function () {
  let score = 50; // Base score

  // Content length bonus (10-20 points)
  const contentLength = this.content.length;
  if (contentLength >= 100) score += 10;
  if (contentLength >= 300) score += 10;

  // Pros/cons bonus (5-10 points)
  if (this.pros.length > 0) score += 5;
  if (this.cons.length > 0) score += 5;

  // Engagement bonus (10-20 points)
  const voteScore = this.upvotes - this.downvotes;
  if (voteScore > 0) score += Math.min(10, voteScore * 2);
  if (this.helpfulCount > 0) score += Math.min(10, this.helpfulCount * 3);

  // Completion bonus (5-15 points)
  if (this.completionPercentage >= 50) score += 5;
  if (this.completionPercentage >= 80) score += 5;
  if (this.completionPercentage === 100) score += 5;

  // Verified purchase bonus (10 points)
  if (this.isVerifiedPurchase) score += 10;

  // Report penalty
  score -= this.reportCount * 5;

  this.qualityScore = Math.max(0, Math.min(100, score));
  return this.qualityScore;
};

// Pre-save middleware
courseReviewSchema.pre('save', function (next) {
  // Update quality score
  this.calculateQualityScore();

  // Update total votes
  this.updateVoteCounts();

  next();
});

// Static Methods
courseReviewSchema.statics.findByCourse = function (courseId: string, options: any = {}) {
  const {
    status = 'published',
    sortBy = 'qualityScore',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = options;

  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find({ courseId, status })
    .populate('userId', 'firstName lastName avatar')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

courseReviewSchema.statics.getAverageRating = function (courseId: string) {
  return this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId), status: 'published' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
};

courseReviewSchema.statics.getRatingDistribution = function (courseId: string) {
  return this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId), status: 'published' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
};

courseReviewSchema.statics.findPendingModeration = function () {
  return this.find({
    $or: [
      { status: 'pending' },
      { reportCount: { $gte: 3 } }
    ]
  })
    .populate('userId', 'firstName lastName email')
    .populate('courseId', 'title')
    .sort({ reportCount: -1, createdAt: 1 });
};

const CourseReview = mongoose.model<ICourseReview>('CourseReview', courseReviewSchema);

export default CourseReview;
