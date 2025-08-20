import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';

// Course Approval Interface
export interface ICourseApproval extends Document {
  approvalId: string; // Unique approval ID (APPR-YYYY-XXXXXX)
  
  // Course Information
  courseId: Types.ObjectId | ICourse;
  instructorId: Types.ObjectId | IUser;
  
  // Approval Status
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required' | 'published' | 'delisted';
  submissionType: 'new_course' | 'course_update' | 'content_revision' | 'resubmission';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Submission Details
  submissionDate: Date;
  lastUpdated: Date;
  targetPublishDate?: Date;
  
  // Review Process
  reviewProcess: {
    currentStage: 'initial_review' | 'content_review' | 'quality_assurance' | 'final_approval' | 'completed';
    completedStages: string[];
    nextStage?: string;
    estimatedCompletionDate?: Date;
    totalReviewTime?: number; // Hours
  };
  
  // Content Analysis
  contentAnalysis: {
    // Course Structure
    hasLearningObjectives: boolean;
    hasCourseSyllabus: boolean;
    hasAssessments: boolean;
    hasResources: boolean;
    lectureCount: number;
    totalDuration: number; // Minutes
    
    // Quality Metrics
    videoQuality: 'low' | 'medium' | 'high' | 'professional';
    audioQuality: 'low' | 'medium' | 'high' | 'professional';
    contentOriginality: number; // Percentage (0-100)
    grammarScore: number; // Score (0-100)
    technicalAccuracy: number; // Score (0-100)
    
    // Engagement Factors
    interactivityLevel: 'low' | 'medium' | 'high';
    practicalExamples: boolean;
    realWorldApplications: boolean;
    studentEngagementPotential: number; // Score (0-100)
    
    // Compliance
    copyrightCompliance: boolean;
    contentAppropriate: boolean;
    accessibilityCompliant: boolean;
    platformGuidelinesCompliant: boolean;
  };
  
  // Review Team
  reviewTeam: {
    primaryReviewer?: Types.ObjectId;
    contentReviewer?: Types.ObjectId;
    technicalReviewer?: Types.ObjectId;
    qualityAssuranceReviewer?: Types.ObjectId;
    finalApprover?: Types.ObjectId;
    
    // Assignment dates
    assignedDate?: Date;
    reviewStartDate?: Date;
    reviewCompletionDate?: Date;
  };
  
  // Review Feedback
  feedback: {
    // Overall Assessment
    overallScore: number; // Score (0-100)
    recommendation: 'approve' | 'reject' | 'revision_required';
    
    // Detailed Reviews
    reviews: Array<{
      reviewerId: Types.ObjectId;
      reviewerType: 'content' | 'technical' | 'quality' | 'admin';
      reviewDate: Date;
      score: number;
      category: string;
      feedback: string;
      issues: Array<{
        severity: 'low' | 'medium' | 'high' | 'critical';
        category: string;
        description: string;
        location?: string; // Lecture/section where issue was found
        suggestion?: string;
        resolved: boolean;
      }>;
      approved: boolean;
    }>;
    
    // Common Issues
    commonIssues: string[];
    strengths: string[];
    improvementAreas: string[];
    
    // Specific Feedback Categories
    contentFeedback: string;
    technicalFeedback: string;
    presentationFeedback: string;
    engagementFeedback: string;
    
    // Instructor Response
    instructorResponse?: {
      responseDate: Date;
      response: string;
      changesImplemented: string[];
      questionsForReviewer: string[];
    };
  };
  
  // Approval Criteria Checklist
  criteria: {
    // Content Quality
    contentQuality: {
      learningObjectivesClear: boolean;
      contentAccurate: boolean;
      contentEngaging: boolean;
      contentOriginal: boolean;
      appropriateDifficulty: boolean;
    };
    
    // Technical Quality
    technicalQuality: {
      videoQualityAcceptable: boolean;
      audioQualityAcceptable: boolean;
      slidesWellDesigned: boolean;
      resourcesUseful: boolean;
      navigationClear: boolean;
    };
    
    // Instructional Design
    instructionalDesign: {
      logicalProgression: boolean;
      practicalExamples: boolean;
      assessmentsAligned: boolean;
      engagementElements: boolean;
      learningOutcomesAchievable: boolean;
    };
    
    // Compliance
    compliance: {
      copyrightRespected: boolean;
      contentAppropriate: boolean;
      accessibilityStandards: boolean;
      platformPolicies: boolean;
      legalRequirements: boolean;
    };
    
    // Market Fit
    marketFit: {
      demandExists: boolean;
      competitiveAdvantage: boolean;
      pricingAppropriate: boolean;
      targetAudienceClear: boolean;
      marketingMaterialsAccurate: boolean;
    };
  };
  
  // Analytics & Metrics
  analytics: {
    // Review Process
    timeToFirstReview: number; // Hours
    totalReviewTime: number; // Hours
    reviewerWorkload: number; // Number of courses in reviewer's queue
    
    // Performance Indicators
    qualityScore: number; // Overall quality score (0-100)
    marketPotential: number; // Market potential score (0-100)
    instructorReliability: number; // Instructor track record score (0-100)
    
    // Prediction Models
    successProbability: number; // Predicted course success (0-100)
    expectedEnrollments: number; // Predicted enrollment numbers
    revenueProjection: number; // Predicted revenue
    
    // Comparison Metrics
    categoryAverage: number; // Average score in course category
    instructorAverage: number; // Instructor's average course score
    platformAverage: number; // Platform average
  };
  
  // Workflow Automation
  automation: {
    autoAssignmentEnabled: boolean;
    remindersSent: number;
    escalationLevel: number;
    slaBreached: boolean;
    automatedChecksCompleted: boolean;
    
    // AI Assistance
    aiPreReview: {
      completed: boolean;
      score: number;
      recommendations: string[];
      flaggedIssues: string[];
      confidenceLevel: number;
    };
  };
  
  // Notifications & Communications
  notifications: {
    instructorNotifications: Array<{
      type: string;
      sentDate: Date;
      message: string;
      acknowledged: boolean;
    }>;
    
    reviewerNotifications: Array<{
      type: string;
      sentDate: Date;
      recipientId: Types.ObjectId;
      message: string;
      acknowledged: boolean;
    }>;
    
    adminNotifications: Array<{
      type: string;
      sentDate: Date;
      message: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  };
  
  // Approval Decision
  decision: {
    finalDecision?: 'approved' | 'rejected';
    decisionDate?: Date;
    decisionMaker?: Types.ObjectId;
    decisionReason?: string;
    conditions?: string[]; // Any conditions for approval
    
    // Publishing Details
    publishDate?: Date;
    publishedBy?: Types.ObjectId;
    publishingNotes?: string;
    
    // Rejection Details
    rejectionReason?: string;
    rejectionCategory?: string;
    appealEligible?: boolean;
    resubmissionAllowed?: boolean;
    resubmissionGuidelines?: string[];
  };
  
  // Version Control
  version: {
    versionNumber: string;
    previousApprovalId?: Types.ObjectId;
    changesFromPrevious?: string[];
    changelogSummary?: string;
  };
  
  // SLA & Timelines
  sla: {
    targetReviewTime: number; // Hours
    actualReviewTime?: number; // Hours
    slaStatus: 'on_track' | 'at_risk' | 'breached';
    escalationDate?: Date;
    priorityBoost?: boolean;
  };
  
  // Audit Trail
  auditLog: Array<{
    action: string;
    timestamp: Date;
    userId: Types.ObjectId;
    userRole: string;
    details: string;
    previousStatus?: string;
    newStatus?: string;
    metadata?: any;
  }>;
}

// Course Approval Schema
const courseApprovalSchema = new Schema<ICourseApproval>({
  approvalId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Course Information
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  instructorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Approval Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'revision_required', 'published', 'delisted'],
    required: true,
    default: 'pending',
    index: true
  },
  submissionType: {
    type: String,
    enum: ['new_course', 'course_update', 'content_revision', 'resubmission'],
    required: true,
    default: 'new_course'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    required: true,
    default: 'normal',
    index: true
  },
  
  // Submission Details
  submissionDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  },
  targetPublishDate: Date,
  
  // Review Process
  reviewProcess: {
    currentStage: {
      type: String,
      enum: ['initial_review', 'content_review', 'quality_assurance', 'final_approval', 'completed'],
      required: true,
      default: 'initial_review'
    },
    completedStages: [String],
    nextStage: String,
    estimatedCompletionDate: Date,
    totalReviewTime: { type: Number, default: 0 }
  },
  
  // Content Analysis
  contentAnalysis: {
    hasLearningObjectives: { type: Boolean, default: false },
    hasCourseSyllabus: { type: Boolean, default: false },
    hasAssessments: { type: Boolean, default: false },
    hasResources: { type: Boolean, default: false },
    lectureCount: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    
    videoQuality: {
      type: String,
      enum: ['low', 'medium', 'high', 'professional'],
      default: 'medium'
    },
    audioQuality: {
      type: String,
      enum: ['low', 'medium', 'high', 'professional'],
      default: 'medium'
    },
    contentOriginality: { type: Number, min: 0, max: 100, default: 0 },
    grammarScore: { type: Number, min: 0, max: 100, default: 0 },
    technicalAccuracy: { type: Number, min: 0, max: 100, default: 0 },
    
    interactivityLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    practicalExamples: { type: Boolean, default: false },
    realWorldApplications: { type: Boolean, default: false },
    studentEngagementPotential: { type: Number, min: 0, max: 100, default: 0 },
    
    copyrightCompliance: { type: Boolean, default: false },
    contentAppropriate: { type: Boolean, default: false },
    accessibilityCompliant: { type: Boolean, default: false },
    platformGuidelinesCompliant: { type: Boolean, default: false }
  },
  
  // Review Team
  reviewTeam: {
    primaryReviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    contentReviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    technicalReviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    qualityAssuranceReviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    finalApprover: { type: Schema.Types.ObjectId, ref: 'User' },
    
    assignedDate: Date,
    reviewStartDate: Date,
    reviewCompletionDate: Date
  },
  
  // Review Feedback
  feedback: {
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    recommendation: {
      type: String,
      enum: ['approve', 'reject', 'revision_required'],
      default: 'revision_required'
    },
    
    reviews: [{
      reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      reviewerType: {
        type: String,
        enum: ['content', 'technical', 'quality', 'admin'],
        required: true
      },
      reviewDate: { type: Date, default: Date.now },
      score: { type: Number, min: 0, max: 100, required: true },
      category: { type: String, required: true },
      feedback: { type: String, required: true },
      issues: [{
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          required: true
        },
        category: { type: String, required: true },
        description: { type: String, required: true },
        location: String,
        suggestion: String,
        resolved: { type: Boolean, default: false }
      }],
      approved: { type: Boolean, default: false }
    }],
    
    commonIssues: [String],
    strengths: [String],
    improvementAreas: [String],
    
    contentFeedback: String,
    technicalFeedback: String,
    presentationFeedback: String,
    engagementFeedback: String,
    
    instructorResponse: {
      responseDate: Date,
      response: String,
      changesImplemented: [String],
      questionsForReviewer: [String]
    }
  },
  
  // Approval Criteria Checklist
  criteria: {
    contentQuality: {
      learningObjectivesClear: { type: Boolean, default: false },
      contentAccurate: { type: Boolean, default: false },
      contentEngaging: { type: Boolean, default: false },
      contentOriginal: { type: Boolean, default: false },
      appropriateDifficulty: { type: Boolean, default: false }
    },
    technicalQuality: {
      videoQualityAcceptable: { type: Boolean, default: false },
      audioQualityAcceptable: { type: Boolean, default: false },
      slidesWellDesigned: { type: Boolean, default: false },
      resourcesUseful: { type: Boolean, default: false },
      navigationClear: { type: Boolean, default: false }
    },
    instructionalDesign: {
      logicalProgression: { type: Boolean, default: false },
      practicalExamples: { type: Boolean, default: false },
      assessmentsAligned: { type: Boolean, default: false },
      engagementElements: { type: Boolean, default: false },
      learningOutcomesAchievable: { type: Boolean, default: false }
    },
    compliance: {
      copyrightRespected: { type: Boolean, default: false },
      contentAppropriate: { type: Boolean, default: false },
      accessibilityStandards: { type: Boolean, default: false },
      platformPolicies: { type: Boolean, default: false },
      legalRequirements: { type: Boolean, default: false }
    },
    marketFit: {
      demandExists: { type: Boolean, default: false },
      competitiveAdvantage: { type: Boolean, default: false },
      pricingAppropriate: { type: Boolean, default: false },
      targetAudienceClear: { type: Boolean, default: false },
      marketingMaterialsAccurate: { type: Boolean, default: false }
    }
  },
  
  // Analytics & Metrics
  analytics: {
    timeToFirstReview: { type: Number, default: 0 },
    totalReviewTime: { type: Number, default: 0 },
    reviewerWorkload: { type: Number, default: 0 },
    
    qualityScore: { type: Number, min: 0, max: 100, default: 0 },
    marketPotential: { type: Number, min: 0, max: 100, default: 0 },
    instructorReliability: { type: Number, min: 0, max: 100, default: 0 },
    
    successProbability: { type: Number, min: 0, max: 100, default: 0 },
    expectedEnrollments: { type: Number, default: 0 },
    revenueProjection: { type: Number, default: 0 },
    
    categoryAverage: { type: Number, default: 0 },
    instructorAverage: { type: Number, default: 0 },
    platformAverage: { type: Number, default: 0 }
  },
  
  // Workflow Automation
  automation: {
    autoAssignmentEnabled: { type: Boolean, default: true },
    remindersSent: { type: Number, default: 0 },
    escalationLevel: { type: Number, default: 0 },
    slaBreached: { type: Boolean, default: false },
    automatedChecksCompleted: { type: Boolean, default: false },
    
    aiPreReview: {
      completed: { type: Boolean, default: false },
      score: { type: Number, min: 0, max: 100, default: 0 },
      recommendations: [String],
      flaggedIssues: [String],
      confidenceLevel: { type: Number, min: 0, max: 100, default: 0 }
    }
  },
  
  // Notifications & Communications
  notifications: {
    instructorNotifications: [{
      type: String,
      sentDate: Date,
      message: String,
      acknowledged: { type: Boolean, default: false }
    }],
    reviewerNotifications: [{
      type: String,
      sentDate: Date,
      recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
      message: String,
      acknowledged: { type: Boolean, default: false }
    }],
    adminNotifications: [{
      type: String,
      sentDate: Date,
      message: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }]
  },
  
  // Approval Decision
  decision: {
    finalDecision: {
      type: String,
      enum: ['approved', 'rejected']
    },
    decisionDate: Date,
    decisionMaker: { type: Schema.Types.ObjectId, ref: 'User' },
    decisionReason: String,
    conditions: [String],
    
    publishDate: Date,
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishingNotes: String,
    
    rejectionReason: String,
    rejectionCategory: String,
    appealEligible: { type: Boolean, default: true },
    resubmissionAllowed: { type: Boolean, default: true },
    resubmissionGuidelines: [String]
  },
  
  // Version Control
  version: {
    versionNumber: { type: String, required: true, default: '1.0' },
    previousApprovalId: { type: Schema.Types.ObjectId, ref: 'CourseApproval' },
    changesFromPrevious: [String],
    changelogSummary: String
  },
  
  // SLA & Timelines
  sla: {
    targetReviewTime: { type: Number, required: true, default: 72 }, // 72 hours default
    actualReviewTime: Number,
    slaStatus: {
      type: String,
      enum: ['on_track', 'at_risk', 'breached'],
      default: 'on_track'
    },
    escalationDate: Date,
    priorityBoost: { type: Boolean, default: false }
  },
  
  // Audit Trail
  auditLog: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userRole: { type: String, required: true },
    details: { type: String, required: true },
    previousStatus: String,
    newStatus: String,
    metadata: Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  collection: 'courseapprovals'
});

// Indexes for performance
courseApprovalSchema.index({ status: 1, submissionDate: -1 });
courseApprovalSchema.index({ instructorId: 1, status: 1 });
courseApprovalSchema.index({ 'reviewTeam.primaryReviewer': 1, status: 1 });
courseApprovalSchema.index({ priority: 1, submissionDate: 1 });
courseApprovalSchema.index({ 'sla.slaStatus': 1, 'sla.escalationDate': 1 });

// Virtual Properties
courseApprovalSchema.virtual('isOverdue').get(function(this: ICourseApproval) {
  if (!this.sla.targetReviewTime) return false;
  const targetTime = this.submissionDate.getTime() + (this.sla.targetReviewTime * 60 * 60 * 1000);
  return Date.now() > targetTime && !['approved', 'rejected', 'published'].includes(this.status);
});

courseApprovalSchema.virtual('timeRemaining').get(function(this: ICourseApproval) {
  if (!this.sla.targetReviewTime) return 0;
  const targetTime = this.submissionDate.getTime() + (this.sla.targetReviewTime * 60 * 60 * 1000);
  return Math.max(0, targetTime - Date.now());
});

courseApprovalSchema.virtual('completionPercentage').get(function(this: ICourseApproval) {
  const stages = ['initial_review', 'content_review', 'quality_assurance', 'final_approval', 'completed'];
  const currentIndex = stages.indexOf(this.reviewProcess.currentStage);
  return Math.round((currentIndex / (stages.length - 1)) * 100);
});

// Instance Methods
courseApprovalSchema.methods.addAuditLog = function(action: string, userId: Types.ObjectId, userRole: string, details: string, metadata?: any): void {
  this.auditLog.push({
    action,
    timestamp: new Date(),
    userId,
    userRole,
    details,
    previousStatus: this.status,
    metadata
  });
};

courseApprovalSchema.methods.assignReviewer = function(reviewerType: string, reviewerId: Types.ObjectId): void {
  this.reviewTeam[reviewerType as keyof typeof this.reviewTeam] = reviewerId;
  if (!this.reviewTeam.assignedDate) {
    this.reviewTeam.assignedDate = new Date();
  }
  this.addAuditLog(`${reviewerType}_assigned`, reviewerId, 'admin', `${reviewerType} assigned to review`);
};

courseApprovalSchema.methods.moveToNextStage = function(): void {
  const stages = ['initial_review', 'content_review', 'quality_assurance', 'final_approval', 'completed'];
  const currentIndex = stages.indexOf(this.reviewProcess.currentStage);
  
  if (currentIndex < stages.length - 1) {
    this.reviewProcess.completedStages.push(this.reviewProcess.currentStage);
    this.reviewProcess.currentStage = stages[currentIndex + 1] as any;
    this.reviewProcess.nextStage = stages[currentIndex + 2] || 'completed';
  }
};

courseApprovalSchema.methods.calculateOverallScore = function(): number {
  if (this.feedback.reviews.length === 0) return 0;
  
  const totalScore = this.feedback.reviews.reduce((sum: number, review: any) => sum + review.score, 0);
  return Math.round(totalScore / this.feedback.reviews.length);
};

courseApprovalSchema.methods.checkSLA = function(): void {
  const hoursElapsed = (Date.now() - this.submissionDate.getTime()) / (1000 * 60 * 60);
  const targetHours = this.sla.targetReviewTime;
  
  if (hoursElapsed > targetHours) {
    this.sla.slaStatus = 'breached';
    this.sla.actualReviewTime = hoursElapsed;
  } else if (hoursElapsed > targetHours * 0.8) {
    this.sla.slaStatus = 'at_risk';
  } else {
    this.sla.slaStatus = 'on_track';
  }
};

// Static Methods
courseApprovalSchema.statics.generateApprovalId = function(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `APPR-${year}-${randomNum}`;
};

courseApprovalSchema.statics.getReviewQueue = function(reviewerId?: Types.ObjectId, status?: string) {
  const matchStage: any = {};
  
  if (reviewerId) {
    matchStage.$or = [
      { 'reviewTeam.primaryReviewer': reviewerId },
      { 'reviewTeam.contentReviewer': reviewerId },
      { 'reviewTeam.technicalReviewer': reviewerId },
      { 'reviewTeam.qualityAssuranceReviewer': reviewerId },
      { 'reviewTeam.finalApprover': reviewerId }
    ];
  }
  
  if (status) {
    matchStage.status = status;
  } else {
    matchStage.status = { $in: ['pending', 'under_review', 'revision_required'] };
  }
  
  return this.find(matchStage)
    .populate('courseId', 'title thumbnail category')
    .populate('instructorId', 'firstName lastName email')
    .sort({ priority: -1, submissionDate: 1 });
};

courseApprovalSchema.statics.getApprovalStatistics = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {};
  
  if (startDate || endDate) {
    matchStage.submissionDate = {};
    if (startDate) matchStage.submissionDate.$gte = startDate;
    if (endDate) matchStage.submissionDate.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        averageReviewTime: { $avg: '$analytics.totalReviewTime' },
        averageScore: { $avg: '$feedback.overallScore' }
      }
    }
  ]);
};

// Pre-save middleware
courseApprovalSchema.pre('save', function(next) {
  if (this.isNew && !this.approvalId) {
    this.approvalId = (this.constructor as any).generateApprovalId();
  }
  
  this.lastUpdated = new Date();
  (this as any).checkSLA();
  
  // Calculate overall score if reviews exist
  if (this.feedback.reviews.length > 0) {
    this.feedback.overallScore = (this as any).calculateOverallScore();
  }
  
  next();
});

const CourseApproval = mongoose.model<ICourseApproval>('CourseApproval', courseApprovalSchema);

export default CourseApproval;
