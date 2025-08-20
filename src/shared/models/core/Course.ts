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
  externalLinks: {
    name: string;
    url: string;
    description?: string;
  }[];
  learningObjectives: string[];
  estimatedDuration?: number; // in hours
  instructorId: mongoose.Types.ObjectId;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  
  // Course Status and Approval Workflow
  status: 'draft' | 'submitted' | 'approved' | 'published' | 'rejected' | 'needs_revision' | 'delisted';
  isPublished: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  submittedAt?: Date;
  submittedForReview?: boolean;
  
  // Enhanced Course Fields
  category: string;
  subcategory?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  targetAudience: string[];
  ageGroup: 'kids' | 'teens' | 'adults' | 'seniors' | 'all';
  accessibility: {
    hasSubtitles: boolean;
    hasAudioDescription: boolean;
    hasSignLanguage: boolean;
    supportsScreenReaders: boolean;
    hasHighContrast: boolean;
  };
  technicalRequirements: {
    minBandwidth: number; // in Mbps
    recommendedBandwidth: number; // in Mbps
    supportedDevices: string[];
    requiredSoftware: string[];
    browserCompatibility: string[];
  };
  learningPath: {
    isPartOfPath: boolean;
    pathId?: mongoose.Types.ObjectId;
    pathOrder?: number;
    prerequisites: mongoose.Types.ObjectId[];
    nextCourses: mongoose.Types.ObjectId[];
  };
  gamification: {
    hasBadges: boolean;
    hasPoints: boolean;
    hasLeaderboard: boolean;
    hasAchievements: boolean;
    hasQuests: boolean;
  };
  socialLearning: {
    hasDiscussionForums: boolean;
    hasGroupProjects: boolean;
    hasPeerReviews: boolean;
    hasStudyGroups: boolean;
    hasMentorship: boolean;
  };
  assessment: {
    hasQuizzes: boolean;
    hasAssignments: boolean;
    hasFinalExam: boolean;
    hasCertification: boolean;
    passingScore: number;
    maxAttempts: number;
  };
  contentDelivery: {
    deliveryMethod: 'self-paced' | 'instructor-led' | 'hybrid' | 'live';
    hasLiveSessions: boolean;
    liveSessionSchedule?: string;
    timezone: string;
    recordingPolicy: 'available' | 'limited' | 'not-available';
  };
  support: {
    hasInstructorSupport: boolean;
    hasCommunitySupport: boolean;
    hasTechnicalSupport: boolean;
    responseTime: 'within-24h' | 'within-48h' | 'within-week' | 'varies';
    officeHours?: string;
  };
  monetization: {
    pricingModel: 'one-time' | 'subscription' | 'freemium' | 'pay-per-lesson';
    hasFreeTrial: boolean;
    trialDuration?: number; // in days
    hasMoneyBackGuarantee: boolean;
    guaranteePeriod?: number; // in days
    installmentPlan?: {
      enabled: boolean;
      numberOfInstallments: number;
      installmentAmount: number;
    };
  };
  analytics: {
    viewCount: number;
    searchRanking: number;
    conversionRate: number;
    engagementScore: number;
    retentionRate: number;
    completionTime: number; // average in hours
    dropoffPoints: string[];
    popularSections: string[];
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
    structuredData: any;
  };
  localization: {
    originalLanguage: string;
    availableLanguages: string[];
    hasSubtitles: boolean;
    subtitleLanguages: string[];
    hasDubbing: boolean;
    dubbedLanguages: string[];
  };
  compliance: {
    gdprCompliant: boolean;
    accessibilityCompliant: boolean;
    industryStandards: string[];
    certifications: string[];
    auditTrail: Array<{
      action: string;
      performedBy: mongoose.Types.ObjectId;
      performedAt: Date;
      details: string;
    }>;
  };
  
  // AI Evaluation
  aiEvaluation?: {
    evaluationId: mongoose.Types.ObjectId;
    overallScore: number;
    lastEvaluatedAt: Date;
    summary: string;
  };
  
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
  
  // Virtual properties
  detailedStatus: string;
  canSubmitForReview: boolean;
  isInReview: boolean;
  needsAction: boolean;
  
  // Instance methods
  submitForAIEvaluation(): Promise<void>;
  approve(adminId: mongoose.Types.ObjectId): Promise<void>;
  publish(): Promise<void>;
  reject(): Promise<void>;
  requestRevision(): Promise<void>;
  delist(): Promise<void>;
  enrollStudent(studentId: mongoose.Types.ObjectId): Promise<void>;
  unenrollStudent(studentId: mongoose.Types.ObjectId): Promise<void>;
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
    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced', 'expert'],
        message: 'Please select a valid difficulty level',
      },
      default: 'beginner',
    },
    targetAudience: {
      type: [String],
      default: [],
      validate: {
        validator: function (audience: string[]) {
          return audience.every(a => a.length <= 100);
        },
        message: 'Each target audience item cannot exceed 100 characters',
      },
    },
    ageGroup: {
      type: String,
      enum: {
        values: ['kids', 'teens', 'adults', 'seniors', 'all'],
        message: 'Please select a valid age group',
      },
      default: 'adults',
    },
    accessibility: {
      hasSubtitles: { type: Boolean, default: false },
      hasAudioDescription: { type: Boolean, default: false },
      hasSignLanguage: { type: Boolean, default: false },
      supportsScreenReaders: { type: Boolean, default: false },
      hasHighContrast: { type: Boolean, default: false },
    },
    technicalRequirements: {
      minBandwidth: { type: Number, default: 1 }, // 1 Mbps minimum
      recommendedBandwidth: { type: Number, default: 5 }, // 5 Mbps recommended
      supportedDevices: { type: [String], default: ['desktop', 'laptop', 'tablet', 'mobile'] },
      requiredSoftware: { type: [String], default: [] },
      browserCompatibility: { type: [String], default: ['chrome', 'firefox', 'safari', 'edge'] },
    },
    learningPath: {
      isPartOfPath: { type: Boolean, default: false },
      pathId: { type: Schema.Types.ObjectId, ref: 'LearningPath' },
      pathOrder: { type: Number, min: 1 },
      prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
      nextCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    },
    gamification: {
      hasBadges: { type: Boolean, default: false },
      hasPoints: { type: Boolean, default: false },
      hasLeaderboard: { type: Boolean, default: false },
      hasAchievements: { type: Boolean, default: false },
      hasQuests: { type: Boolean, default: false },
    },
    socialLearning: {
      hasDiscussionForums: { type: Boolean, default: false },
      hasGroupProjects: { type: Boolean, default: false },
      hasPeerReviews: { type: Boolean, default: false },
      hasStudyGroups: { type: Boolean, default: false },
      hasMentorship: { type: Boolean, default: false },
    },
    assessment: {
      hasQuizzes: { type: Boolean, default: false },
      hasAssignments: { type: Boolean, default: false },
      hasFinalExam: { type: Boolean, default: false },
      hasCertification: { type: Boolean, default: false },
      passingScore: { type: Number, min: 0, max: 100, default: 70 },
      maxAttempts: { type: Number, min: 1, default: 3 },
    },
    contentDelivery: {
      deliveryMethod: {
        type: String,
        enum: ['self-paced', 'instructor-led', 'hybrid', 'live'],
        default: 'self-paced',
      },
      hasLiveSessions: { type: Boolean, default: false },
      liveSessionSchedule: { type: String },
      timezone: { type: String, default: 'UTC' },
      recordingPolicy: {
        type: String,
        enum: ['available', 'limited', 'not-available'],
        default: 'available',
      },
    },
    support: {
      hasInstructorSupport: { type: Boolean, default: false },
      hasCommunitySupport: { type: Boolean, default: false },
      hasTechnicalSupport: { type: Boolean, default: false },
      responseTime: {
        type: String,
        enum: ['within-24h', 'within-48h', 'within-week', 'varies'],
        default: 'varies',
      },
      officeHours: { type: String },
    },
    monetization: {
      pricingModel: {
        type: String,
        enum: ['one-time', 'subscription', 'freemium', 'pay-per-lesson'],
        default: 'one-time',
      },
      hasFreeTrial: { type: Boolean, default: false },
      trialDuration: { type: Number, min: 1, max: 30 }, // in days
      hasMoneyBackGuarantee: { type: Boolean, default: false },
      guaranteePeriod: { type: Number, min: 1, max: 90 }, // in days
      installmentPlan: {
        enabled: { type: Boolean, default: false },
        numberOfInstallments: { type: Number, min: 2, max: 12 },
        installmentAmount: { type: Number, min: 0 },
      },
    },
    analytics: {
      viewCount: { type: Number, default: 0 },
      searchRanking: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0, min: 0, max: 100 },
      engagementScore: { type: Number, default: 0, min: 0, max: 100 },
      retentionRate: { type: Number, default: 0, min: 0, max: 100 },
      completionTime: { type: Number, default: 0 }, // average in hours
      dropoffPoints: { type: [String], default: [] },
      popularSections: { type: [String], default: [] },
    },
    seo: {
      metaTitle: { type: String, maxlength: 60 },
      metaDescription: { type: String, maxlength: 160 },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String },
      structuredData: { type: Schema.Types.Mixed },
    },
    localization: {
      originalLanguage: { type: String, required: true, default: 'en' },
      availableLanguages: { type: [String], default: ['en'] },
      hasSubtitles: { type: Boolean, default: false },
      subtitleLanguages: { type: [String], default: [] },
      hasDubbing: { type: Boolean, default: false },
      dubbedLanguages: { type: [String], default: [] },
    },
    compliance: {
      gdprCompliant: { type: Boolean, default: false },
      accessibilityCompliant: { type: Boolean, default: false },
      industryStandards: { type: [String], default: [] },
      certifications: { type: [String], default: [] },
      auditTrail: [{
        action: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        performedAt: { type: Date, default: Date.now },
        details: { type: String },
      }],
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
    externalLinks: {
      type: [{
        name: { type: String, required: true, maxlength: 100 },
        url: { type: String, required: true, maxlength: 500 },
        description: { type: String, maxlength: 200 }
      }],
      default: []
    },
    learningObjectives: {
      type: [String],
      default: [],
      validate: {
        validator: function (objectives: string[]) {
          return objectives.every(obj => obj.length <= 200);
        },
        message: 'Each learning objective cannot exceed 200 characters',
      },
    },
    estimatedDuration: {
      type: Number,
      min: [0.5, 'Estimated duration must be at least 0.5 hours'],
      max: [1000, 'Estimated duration cannot exceed 1000 hours']
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
    // Course Status and Approval Workflow
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'published', 'rejected', 'needs_revision', 'delisted'],
      default: 'draft',
      index: true
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
    submittedAt: {
      type: Date,
      index: true
    },
    submittedForReview: {
      type: Boolean,
      default: false
    },
    
    // AI Evaluation
    aiEvaluation: {
      evaluationId: {
        type: Schema.Types.ObjectId,
        ref: 'AIEvaluation'
      },
      overallScore: {
        type: Number,
        min: 0,
        max: 100
      },
      lastEvaluatedAt: Date,
      summary: {
        type: String,
        maxlength: 500
      }
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
courseSchema.index({ status: 1 });
courseSchema.index({ isPublished: 1, isApproved: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ submittedAt: -1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ isFeatured: 1, isPublished: 1, isApproved: 1 });
courseSchema.index({ enrolledStudents: 1 });
courseSchema.index({ averageRating: -1, totalRatings: -1 });
courseSchema.index({ 'aiEvaluation.overallScore': -1 });
courseSchema.index({ status: 1, submittedAt: -1 });

// Virtual for discount amount
courseSchema.virtual('discountAmount').get(function () {
  if (!this.originalPrice || !this.discountPercentage) return 0;
  return this.originalPrice - this.price;
});

// Virtual for isDiscounted
courseSchema.virtual('isDiscounted').get(function () {
  return !!(this.originalPrice && this.discountPercentage);
});

// Virtual for detailed status
courseSchema.virtual('detailedStatus').get(function () {
  const statusMap = {
    'draft': 'Bản nháp',
    'submitted': 'Đã gửi đánh giá',
    'approved': 'Đã duyệt',
    'published': 'Đã xuất bản',
    'rejected': 'Bị từ chối',
    'needs_revision': 'Cần chỉnh sửa',
    'delisted': 'Đã gỡ bỏ'
  };
  return statusMap[this.status] || 'Không xác định';
});

// Virtual for canSubmitForReview
courseSchema.virtual('canSubmitForReview').get(function () {
  return this.status === 'draft' && !this.submittedForReview;
});

// Virtual for isInReview
courseSchema.virtual('isInReview').get(function () {
  return ['submitted'].includes(this.status);
});

// Virtual for needsAction (for teachers)
courseSchema.virtual('needsAction').get(function () {
  return this.status === 'needs_revision';
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

// Static method to find courses pending AI evaluation
courseSchema.statics.findPendingAIEvaluation = function () {
  return this.find({ status: 'submitted' }).sort({ submittedAt: 1 });
};

// Static method to find courses pending admin review
courseSchema.statics.findPendingAdminReview = function () {
  return this.find({ status: 'submitted' })
    .populate('aiEvaluation.evaluationId')
    .sort({ submittedAt: 1 });
};

// Static method to find courses by status
courseSchema.statics.findByStatus = function (status: string) {
  return this.find({ status }).sort({ updatedAt: -1 });
};

// Static method to find courses needing revision
courseSchema.statics.findNeedingRevision = function (instructorId?: string) {
  const query: any = { status: 'needs_revision' };
  if (instructorId) {
    query.instructorId = instructorId;
  }
  return this.find(query).sort({ updatedAt: -1 });
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

// Instance method to submit for AI evaluation
courseSchema.methods.submitForAIEvaluation = async function () {
  if (!this.canSubmitForReview) {
    throw new Error('Course is not ready for submission');
  }

  this.status = 'submitted';
  this.submittedAt = new Date();
  this.submittedForReview = true;
  await this.save();
};

// Instance method to approve course
courseSchema.methods.approve = async function (adminId: mongoose.Types.ObjectId) {
  this.status = 'approved';
  this.isApproved = true;
  this.approvedAt = new Date();
  this.approvedBy = adminId;
  await this.save();
};

// Instance method to publish course
courseSchema.methods.publish = async function () {
  if (!this.isApproved) {
    throw new Error('Course must be approved before publishing');
  }

  this.status = 'published';
  this.isPublished = true;
  this.publishedAt = new Date();
  await this.save();
};

// Instance method to reject course
courseSchema.methods.reject = async function () {
  this.status = 'rejected';
  this.isApproved = false;
  await this.save();
};

// Instance method to request revision
courseSchema.methods.requestRevision = async function () {
  this.status = 'needs_revision';
  this.submittedForReview = false;
  await this.save();
};

// Instance method to delist course
courseSchema.methods.delist = async function () {
  this.status = 'delisted';
  this.isPublished = false;
  await this.save();
};

// Export the model
export default mongoose.model<ICourse>('Course', courseSchema);
