import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';

// Teacher Rating Interface (Student feedback for teachers)
export interface ITeacherRating extends Document {
  ratingId: string; // Unique rating ID
  
  // Participants
  studentId: Types.ObjectId | IUser;
  teacherId: Types.ObjectId | IUser;
  courseId: Types.ObjectId | ICourse;
  
  // Rating Categories (1-5 scale)
  ratings: {
    // Teaching Quality (40% weight)
    teachingQuality: {
      clarity: number; // How clear are explanations
      organization: number; // Course structure and organization
      preparation: number; // Teacher preparedness
      knowledgeDepth: number; // Subject matter expertise
    };
    
    // Communication & Support (30% weight)
    communication: {
      responsiveness: number; // Response time to questions
      helpfulness: number; // Willingness to help
      availability: number; // Accessibility outside class
      feedbackQuality: number; // Quality of feedback on assignments
    };
    
    // Engagement & Motivation (20% weight)
    engagement: {
      enthusiasm: number; // Teacher's enthusiasm for subject
      studentEngagement: number; // Ability to engage students
      interactivity: number; // Interactive teaching methods
      inspiration: number; // Motivates student learning
    };
    
    // Fairness & Professionalism (10% weight)
    professionalism: {
      fairness: number; // Fair grading and treatment
      respect: number; // Respectful treatment of students
      punctuality: number; // Timeliness and reliability
      professionalism: number; // Professional conduct
    };
  };
  
  // Overall Rating (calculated from categories)
  overallRating: number; // Weighted average of all categories
  
  // Detailed Feedback
  feedback: {
    // Text Reviews
    positiveAspects: string; // What student liked most
    improvementAreas: string; // Areas for improvement
    additionalComments: string; // General comments
    
    // Specific Feedback Categories
    courseContent: {
      rating: number;
      comments?: string;
    };
    courseDifficulty: {
      rating: number; // 1=too easy, 3=just right, 5=too hard
      comments?: string;
    };
    courseLoad: {
      rating: number; // 1=too light, 3=appropriate, 5=too heavy
      comments?: string;
    };
    
    // Recommendations
    wouldRecommend: boolean;
    wouldTakeAgain: boolean;
    recommendationReason?: string;
  };
  
  // Course Context
  courseContext: {
    enrollmentDate: Date;
    completionDate?: Date;
    finalGrade?: number;
    attendanceRate: number;
    assignmentsCompleted: number;
    totalAssignments: number;
    courseProgress: number; // Percentage completed when rated
  };
  
  // Rating Context
  ratingContext: {
    ratingDate: Date;
    ratingReason: 'course_completion' | 'mid_course' | 'voluntary' | 'requested';
    timeSpentInCourse: number; // Hours
    interactionFrequency: 'high' | 'medium' | 'low';
    supportReceived: boolean; // Did student receive teacher support
  };
  
  // Verification & Quality
  verification: {
    isVerified: boolean; // Verified as genuine feedback
    verificationMethod: 'enrollment_check' | 'email_verification' | 'manual_review';
    isAnonymous: boolean;
    qualityScore: number; // 0-100, quality of feedback
    flaggedAsInappropriate: boolean;
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  };
  
  // Helpful votes (other students can vote)
  helpfulness: {
    helpfulVotes: number;
    notHelpfulVotes: number;
    totalVotes: number;
    helpfulnessRatio: number; // helpful / total
  };
  
  // Response from Teacher
  teacherResponse?: {
    responseText: string;
    responseDate: Date;
    isPublic: boolean;
    acknowledgedIssues: string[];
    improvementCommitments: string[];
  };
  
  // Admin Review
  adminReview?: {
    reviewedBy: Types.ObjectId;
    reviewDate: Date;
    reviewNotes: string;
    actionTaken: string;
    followUpRequired: boolean;
  };
  
  // Status and Metadata
  status: 'active' | 'hidden' | 'flagged' | 'removed';
  visibility: 'public' | 'teacher_only' | 'admin_only';
  
  // Analytics Data
  analytics: {
    viewCount: number;
    shareCount: number;
    reportCount: number; // How many times reported
    influenceScore: number; // Impact on teacher's overall rating
  };
  
  // Audit Trail
  auditLog: Array<{
    action: string;
    timestamp: Date;
    userId: Types.ObjectId;
    details: string;
    ipAddress?: string;
  }>;
}

// Teacher Rating Schema
const teacherRatingSchema = new Schema<ITeacherRating>({
  ratingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Participants
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  
  // Rating Categories
  ratings: {
    teachingQuality: {
      clarity: { type: Number, required: true, min: 1, max: 5 },
      organization: { type: Number, required: true, min: 1, max: 5 },
      preparation: { type: Number, required: true, min: 1, max: 5 },
      knowledgeDepth: { type: Number, required: true, min: 1, max: 5 }
    },
    communication: {
      responsiveness: { type: Number, required: true, min: 1, max: 5 },
      helpfulness: { type: Number, required: true, min: 1, max: 5 },
      availability: { type: Number, required: true, min: 1, max: 5 },
      feedbackQuality: { type: Number, required: true, min: 1, max: 5 }
    },
    engagement: {
      enthusiasm: { type: Number, required: true, min: 1, max: 5 },
      studentEngagement: { type: Number, required: true, min: 1, max: 5 },
      interactivity: { type: Number, required: true, min: 1, max: 5 },
      inspiration: { type: Number, required: true, min: 1, max: 5 }
    },
    professionalism: {
      fairness: { type: Number, required: true, min: 1, max: 5 },
      respect: { type: Number, required: true, min: 1, max: 5 },
      punctuality: { type: Number, required: true, min: 1, max: 5 },
      professionalism: { type: Number, required: true, min: 1, max: 5 }
    }
  },
  
  // Overall Rating
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  
  // Detailed Feedback
  feedback: {
    positiveAspects: { type: String, maxlength: 1000 },
    improvementAreas: { type: String, maxlength: 1000 },
    additionalComments: { type: String, maxlength: 1500 },
    
    courseContent: {
      rating: { type: Number, required: true, min: 1, max: 5 },
      comments: { type: String, maxlength: 500 }
    },
    courseDifficulty: {
      rating: { type: Number, required: true, min: 1, max: 5 },
      comments: { type: String, maxlength: 500 }
    },
    courseLoad: {
      rating: { type: Number, required: true, min: 1, max: 5 },
      comments: { type: String, maxlength: 500 }
    },
    
    wouldRecommend: { type: Boolean, required: true },
    wouldTakeAgain: { type: Boolean, required: true },
    recommendationReason: { type: String, maxlength: 500 }
  },
  
  // Course Context
  courseContext: {
    enrollmentDate: { type: Date, required: true },
    completionDate: Date,
    finalGrade: { type: Number, min: 0, max: 100 },
    attendanceRate: { type: Number, required: true, min: 0, max: 100 },
    assignmentsCompleted: { type: Number, required: true, min: 0 },
    totalAssignments: { type: Number, required: true, min: 0 },
    courseProgress: { type: Number, required: true, min: 0, max: 100 }
  },
  
  // Rating Context
  ratingContext: {
    ratingDate: { type: Date, required: true, default: Date.now },
    ratingReason: {
      type: String,
      enum: ['course_completion', 'mid_course', 'voluntary', 'requested'],
      required: true
    },
    timeSpentInCourse: { type: Number, required: true, min: 0 },
    interactionFrequency: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true
    },
    supportReceived: { type: Boolean, required: true }
  },
  
  // Verification & Quality
  verification: {
    isVerified: { type: Boolean, default: false },
    verificationMethod: {
      type: String,
      enum: ['enrollment_check', 'email_verification', 'manual_review'],
      default: 'enrollment_check'
    },
    isAnonymous: { type: Boolean, default: false },
    qualityScore: { type: Number, min: 0, max: 100, default: 0 },
    flaggedAsInappropriate: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending'
    }
  },
  
  // Helpfulness
  helpfulness: {
    helpfulVotes: { type: Number, default: 0, min: 0 },
    notHelpfulVotes: { type: Number, default: 0, min: 0 },
    totalVotes: { type: Number, default: 0, min: 0 },
    helpfulnessRatio: { type: Number, default: 0, min: 0, max: 1 }
  },
  
  // Teacher Response
  teacherResponse: {
    responseText: { type: String, maxlength: 2000 },
    responseDate: Date,
    isPublic: { type: Boolean, default: true },
    acknowledgedIssues: [{ type: String }],
    improvementCommitments: [{ type: String }]
  },
  
  // Admin Review
  adminReview: {
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewDate: Date,
    reviewNotes: { type: String, maxlength: 1000 },
    actionTaken: { type: String, maxlength: 500 },
    followUpRequired: { type: Boolean, default: false }
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'hidden', 'flagged', 'removed'],
    default: 'active',
    index: true
  },
  visibility: {
    type: String,
    enum: ['public', 'teacher_only', 'admin_only'],
    default: 'public'
  },
  
  // Analytics
  analytics: {
    viewCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    reportCount: { type: Number, default: 0, min: 0 },
    influenceScore: { type: Number, default: 0, min: 0, max: 100 }
  },
  
  // Audit Trail
  auditLog: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, required: true },
    ipAddress: String
  }]
}, {
  timestamps: true,
  collection: 'teacherratings'
});

// Indexes for performance
teacherRatingSchema.index({ teacherId: 1, overallRating: -1 });
teacherRatingSchema.index({ courseId: 1, overallRating: -1 });
teacherRatingSchema.index({ studentId: 1, 'ratingContext.ratingDate': -1 });
teacherRatingSchema.index({ 'verification.moderationStatus': 1 });
teacherRatingSchema.index({ status: 1, visibility: 1 });

// Compound indexes
teacherRatingSchema.index({ teacherId: 1, courseId: 1, studentId: 1 }, { unique: true });

// Virtual Properties
teacherRatingSchema.virtual('categoryAverages').get(function(this: ITeacherRating) {
  const teachingQuality = (
    this.ratings.teachingQuality.clarity +
    this.ratings.teachingQuality.organization +
    this.ratings.teachingQuality.preparation +
    this.ratings.teachingQuality.knowledgeDepth
  ) / 4;
  
  const communication = (
    this.ratings.communication.responsiveness +
    this.ratings.communication.helpfulness +
    this.ratings.communication.availability +
    this.ratings.communication.feedbackQuality
  ) / 4;
  
  const engagement = (
    this.ratings.engagement.enthusiasm +
    this.ratings.engagement.studentEngagement +
    this.ratings.engagement.interactivity +
    this.ratings.engagement.inspiration
  ) / 4;
  
  const professionalism = (
    this.ratings.professionalism.fairness +
    this.ratings.professionalism.respect +
    this.ratings.professionalism.punctuality +
    this.ratings.professionalism.professionalism
  ) / 4;
  
  return {
    teachingQuality: Math.round(teachingQuality * 100) / 100,
    communication: Math.round(communication * 100) / 100,
    engagement: Math.round(engagement * 100) / 100,
    professionalism: Math.round(professionalism * 100) / 100
  };
});

teacherRatingSchema.virtual('isRecent').get(function(this: ITeacherRating) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.ratingContext.ratingDate > thirtyDaysAgo;
});

teacherRatingSchema.virtual('isHelpful').get(function(this: ITeacherRating) {
  return this.helpfulness.helpfulnessRatio >= 0.7 && this.helpfulness.totalVotes >= 3;
});

// Instance Methods
teacherRatingSchema.methods.calculateOverallRating = function(): number {
  const categories = this.categoryAverages;
  
  // Weighted calculation
  const weighted = (
    (categories.teachingQuality * 0.40) +
    (categories.communication * 0.30) +
    (categories.engagement * 0.20) +
    (categories.professionalism * 0.10)
  );
  
  return Math.round(weighted * 100) / 100;
};

teacherRatingSchema.methods.addHelpfulVote = function(isHelpful: boolean): void {
  if (isHelpful) {
    this.helpfulness.helpfulVotes += 1;
  } else {
    this.helpfulness.notHelpfulVotes += 1;
  }
  
  this.helpfulness.totalVotes += 1;
  this.helpfulness.helpfulnessRatio = this.helpfulness.helpfulVotes / this.helpfulness.totalVotes;
};

teacherRatingSchema.methods.addTeacherResponse = function(responseText: string, acknowledgedIssues: string[] = [], improvementCommitments: string[] = [], isPublic: boolean = true): void {
  this.teacherResponse = {
    responseText,
    responseDate: new Date(),
    isPublic,
    acknowledgedIssues,
    improvementCommitments
  };
};

teacherRatingSchema.methods.flagAsInappropriate = function(reason: string, userId: Types.ObjectId): void {
  this.verification.flaggedAsInappropriate = true;
  this.verification.moderationStatus = 'flagged';
  this.analytics.reportCount += 1;
  
  this.addAuditLog('flagged_inappropriate', userId, `Flagged as inappropriate: ${reason}`);
};

teacherRatingSchema.methods.addAuditLog = function(action: string, userId: Types.ObjectId, details: string, ipAddress?: string): void {
  this.auditLog.push({
    action,
    timestamp: new Date(),
    userId,
    details,
    ipAddress
  });
};

// Static Methods
teacherRatingSchema.statics.generateRatingId = function(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `RATING-${timestamp}-${random}`;
};

teacherRatingSchema.statics.findByTeacher = function(teacherId: Types.ObjectId, options: any = {}) {
  const query: any = { teacherId, status: 'active' };
  
  if (options.courseId) query.courseId = options.courseId;
  if (options.minRating) query.overallRating = { $gte: options.minRating };
  if (options.verified) query['verification.isVerified'] = true;
  
  return this.find(query).sort({ 'ratingContext.ratingDate': -1 });
};

teacherRatingSchema.statics.getTeacherStats = function(teacherId: Types.ObjectId) {
  return this.aggregate([
    { $match: { teacherId, status: 'active' } },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageRating: { $avg: '$overallRating' },
        teachingQuality: { $avg: {
          $avg: [
            '$ratings.teachingQuality.clarity',
            '$ratings.teachingQuality.organization',
            '$ratings.teachingQuality.preparation',
            '$ratings.teachingQuality.knowledgeDepth'
          ]
        }},
        communication: { $avg: {
          $avg: [
            '$ratings.communication.responsiveness',
            '$ratings.communication.helpfulness',
            '$ratings.communication.availability',
            '$ratings.communication.feedbackQuality'
          ]
        }},
        engagement: { $avg: {
          $avg: [
            '$ratings.engagement.enthusiasm',
            '$ratings.engagement.studentEngagement',
            '$ratings.engagement.interactivity',
            '$ratings.engagement.inspiration'
          ]
        }},
        professionalism: { $avg: {
          $avg: [
            '$ratings.professionalism.fairness',
            '$ratings.professionalism.respect',
            '$ratings.professionalism.punctuality',
            '$ratings.professionalism.professionalism'
          ]
        }},
        recommendationRate: { $avg: { $cond: ['$feedback.wouldRecommend', 1, 0] } },
        retakeRate: { $avg: { $cond: ['$feedback.wouldTakeAgain', 1, 0] } }
      }
    }
  ]);
};

// Pre-save middleware
teacherRatingSchema.pre('save', function(next) {
  if (this.isNew && !this.ratingId) {
    this.ratingId = (this.constructor as any).generateRatingId();
  }
  
  // Calculate overall rating manually since calculateOverallRating is an instance method
  const teachingQuality = (
    this.ratings.teachingQuality.clarity +
    this.ratings.teachingQuality.organization +
    this.ratings.teachingQuality.preparation +
    this.ratings.teachingQuality.knowledgeDepth
  ) / 4;
  
  const communication = (
    this.ratings.communication.responsiveness +
    this.ratings.communication.helpfulness +
    this.ratings.communication.availability +
    this.ratings.communication.feedbackQuality
  ) / 4;
  
  const engagement = (
    this.ratings.engagement.enthusiasm +
    this.ratings.engagement.studentEngagement +
    this.ratings.engagement.interactivity +
    this.ratings.engagement.inspiration
  ) / 4;
  
  const professionalism = (
    this.ratings.professionalism.fairness +
    this.ratings.professionalism.respect +
    this.ratings.professionalism.punctuality +
    this.ratings.professionalism.professionalism
  ) / 4;
  
  // Weighted calculation
  this.overallRating = Math.round(((
    (teachingQuality * 0.40) +
    (communication * 0.30) +
    (engagement * 0.20) +
    (professionalism * 0.10)
  ) * 100)) / 100;
  
  // Update helpfulness ratio
  if (this.helpfulness.totalVotes > 0) {
    this.helpfulness.helpfulnessRatio = this.helpfulness.helpfulVotes / this.helpfulness.totalVotes;
  }
  
  next();
});

const TeacherRating = mongoose.model<ITeacherRating>('TeacherRating', teacherRatingSchema);

export default TeacherRating;
