import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';

// Teacher Score Interface
export interface ITeacherScore extends Document {
  teacherId: Types.ObjectId | IUser;
  scoreId: string; // Unique score ID (SCORE-YYYY-XXXXXX)
  
  // Scoring Period
  periodType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  
  // Overall Scores (0-100)
  overallScore: number;
  previousScore?: number;
  scoreChange: number; // Change from previous period
  scoreGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  
  // Core Metrics (0-100 each)
  metrics: {
    // Student Satisfaction (40% weight)
    studentRating: {
      score: number;
      averageRating: number;
      totalRatings: number;
      responseRate: number;
    };
    
    // Course Performance (30% weight)
    coursePerformance: {
      score: number;
      completionRate: number;
      averageGrade: number;
      dropoutRate: number;
      passRate: number;
    };
    
    // Engagement & Activity (20% weight)
    engagement: {
      score: number;
      responseTime: number; // Hours average response time
      forumParticipation: number;
      assignmentFeedbackQuality: number;
      availabilityHours: number;
    };
    
    // Professional Development (10% weight)
    development: {
      score: number;
      coursesCreated: number;
      contentUpdates: number;
      skillsImprovement: number;
      certificationEarned: number;
    };
  };
  
  // Detailed Analytics
  analytics: {
    // Course Statistics
    coursesActive: number;
    coursesCompleted: number;
    totalStudents: number;
    totalEnrollments: number;
    averageClassSize: number;
    
    // Student Feedback Analysis
    feedback: {
      positive: number;
      neutral: number;
      negative: number;
      commonCompliments: string[];
      commonComplaints: string[];
      improvementSuggestions: string[];
    };
    
    // Performance Trends
    trends: {
      enrollmentTrend: 'increasing' | 'stable' | 'decreasing';
      ratingTrend: 'improving' | 'stable' | 'declining';
      completionTrend: 'improving' | 'stable' | 'declining';
      engagementTrend: 'increasing' | 'stable' | 'decreasing';
    };
    
    // Comparative Analysis
    ranking: {
      overallRank: number;
      departmentRank: number;
      categoryRank: number;
      totalTeachers: number;
      percentile: number;
    };
  };
  
  // Goals and Targets
  goals: {
    targetScore: number;
    targetAchieved: boolean;
    improvementAreas: string[];
    strengthAreas: string[];
    actionPlan: string[];
    nextReviewDate: Date;
  };
  
  // Additional Achievements
  achievements: {
    badges: string[];
    milestones: string[];
    recognitions: string[];
    awards: string[];
  };
  
  // Status and Metadata
  status: 'active' | 'under_review' | 'final' | 'archived';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Audit Trail
  auditLog: Array<{
    action: string;
    timestamp: Date;
    userId: Types.ObjectId;
    details: string;
    previousValues?: any;
    newValues?: any;
  }>;
  
  // Metadata
  metadata: {
    generatedBy: 'system' | 'admin' | 'manual';
    version: string;
    calculationMethod: string;
    dataSource: string[];
    confidenceLevel: number;
  };
}

// Teacher Score Schema
const teacherScoreSchema = new Schema<ITeacherScore>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scoreId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Scoring Period
  periodType: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    required: true,
    default: 'monthly'
  },
  periodStart: {
    type: Date,
    required: true,
    index: true
  },
  periodEnd: {
    type: Date,
    required: true,
    index: true
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Overall Scores
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  previousScore: {
    type: Number,
    min: 0,
    max: 100
  },
  scoreChange: {
    type: Number,
    default: 0
  },
  scoreGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    required: true
  },
  
  // Core Metrics
  metrics: {
    studentRating: {
      score: { type: Number, required: true, min: 0, max: 100 },
      averageRating: { type: Number, required: true, min: 0, max: 5 },
      totalRatings: { type: Number, required: true, min: 0 },
      responseRate: { type: Number, required: true, min: 0, max: 100 }
    },
    coursePerformance: {
      score: { type: Number, required: true, min: 0, max: 100 },
      completionRate: { type: Number, required: true, min: 0, max: 100 },
      averageGrade: { type: Number, required: true, min: 0, max: 100 },
      dropoutRate: { type: Number, required: true, min: 0, max: 100 },
      passRate: { type: Number, required: true, min: 0, max: 100 }
    },
    engagement: {
      score: { type: Number, required: true, min: 0, max: 100 },
      responseTime: { type: Number, required: true, min: 0 },
      forumParticipation: { type: Number, required: true, min: 0, max: 100 },
      assignmentFeedbackQuality: { type: Number, required: true, min: 0, max: 100 },
      availabilityHours: { type: Number, required: true, min: 0, max: 168 }
    },
    development: {
      score: { type: Number, required: true, min: 0, max: 100 },
      coursesCreated: { type: Number, required: true, min: 0 },
      contentUpdates: { type: Number, required: true, min: 0 },
      skillsImprovement: { type: Number, required: true, min: 0, max: 100 },
      certificationEarned: { type: Number, required: true, min: 0 }
    }
  },
  
  // Detailed Analytics
  analytics: {
    coursesActive: { type: Number, required: true, min: 0 },
    coursesCompleted: { type: Number, required: true, min: 0 },
    totalStudents: { type: Number, required: true, min: 0 },
    totalEnrollments: { type: Number, required: true, min: 0 },
    averageClassSize: { type: Number, required: true, min: 0 },
    
    feedback: {
      positive: { type: Number, required: true, min: 0 },
      neutral: { type: Number, required: true, min: 0 },
      negative: { type: Number, required: true, min: 0 },
      commonCompliments: [{ type: String }],
      commonComplaints: [{ type: String }],
      improvementSuggestions: [{ type: String }]
    },
    
    trends: {
      enrollmentTrend: {
        type: String,
        enum: ['increasing', 'stable', 'decreasing'],
        required: true
      },
      ratingTrend: {
        type: String,
        enum: ['improving', 'stable', 'declining'],
        required: true
      },
      completionTrend: {
        type: String,
        enum: ['improving', 'stable', 'declining'],
        required: true
      },
      engagementTrend: {
        type: String,
        enum: ['increasing', 'stable', 'decreasing'],
        required: true
      }
    },
    
    ranking: {
      overallRank: { type: Number, required: true, min: 1 },
      departmentRank: { type: Number, required: true, min: 1 },
      categoryRank: { type: Number, required: true, min: 1 },
      totalTeachers: { type: Number, required: true, min: 1 },
      percentile: { type: Number, required: true, min: 0, max: 100 }
    }
  },
  
  // Goals and Targets
  goals: {
    targetScore: { type: Number, required: true, min: 0, max: 100 },
    targetAchieved: { type: Boolean, required: true, default: false },
    improvementAreas: [{ type: String }],
    strengthAreas: [{ type: String }],
    actionPlan: [{ type: String }],
    nextReviewDate: { type: Date }
  },
  
  // Additional Achievements
  achievements: {
    badges: [{ type: String }],
    milestones: [{ type: String }],
    recognitions: [{ type: String }],
    awards: [{ type: String }]
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'under_review', 'final', 'archived'],
    default: 'active',
    index: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  
  // Audit Trail
  auditLog: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, required: true },
    previousValues: Schema.Types.Mixed,
    newValues: Schema.Types.Mixed
  }],
  
  // Metadata
  metadata: {
    generatedBy: {
      type: String,
      enum: ['system', 'admin', 'manual'],
      required: true,
      default: 'system'
    },
    version: { type: String, required: true, default: '1.0' },
    calculationMethod: { type: String, required: true },
    dataSource: [{ type: String }],
    confidenceLevel: { type: Number, required: true, min: 0, max: 100, default: 95 }
  }
}, {
  timestamps: true,
  collection: 'teacherscores'
});

// Indexes for performance
teacherScoreSchema.index({ teacherId: 1, periodStart: -1 });
teacherScoreSchema.index({ teacherId: 1, periodType: 1, periodStart: -1 });
teacherScoreSchema.index({ overallScore: -1 });
teacherScoreSchema.index({ scoreGrade: 1 });
teacherScoreSchema.index({ status: 1, generatedAt: -1 });
teacherScoreSchema.index({ 'analytics.ranking.overallRank': 1 });

// Virtual Properties
teacherScoreSchema.virtual('isCurrentPeriod').get(function(this: ITeacherScore) {
  const now = new Date();
  return now >= this.periodStart && now <= this.periodEnd;
});

teacherScoreSchema.virtual('periodDuration').get(function(this: ITeacherScore) {
  return Math.ceil((this.periodEnd.getTime() - this.periodStart.getTime()) / (1000 * 60 * 60 * 24));
});

teacherScoreSchema.virtual('scoreCategory').get(function(this: ITeacherScore) {
  if (this.overallScore >= 90) return 'Excellent';
  if (this.overallScore >= 80) return 'Good';
  if (this.overallScore >= 70) return 'Satisfactory';
  if (this.overallScore >= 60) return 'Needs Improvement';
  return 'Poor';
});

teacherScoreSchema.virtual('improvementNeeded').get(function(this: ITeacherScore) {
  return this.overallScore < this.goals.targetScore;
});

// Instance Methods
teacherScoreSchema.methods.addAuditLog = function(action: string, userId: Types.ObjectId, details: string, previousValues?: any, newValues?: any) {
  this.auditLog.push({
    action,
    timestamp: new Date(),
    userId,
    details,
    previousValues,
    newValues
  });
};

teacherScoreSchema.methods.calculateScoreGrade = function(): string {
  const score = this.overallScore;
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

teacherScoreSchema.methods.updateRanking = function(overallRank: number, departmentRank: number, categoryRank: number, totalTeachers: number) {
  this.analytics.ranking = {
    overallRank,
    departmentRank,
    categoryRank,
    totalTeachers,
    percentile: Math.round(((totalTeachers - overallRank + 1) / totalTeachers) * 100)
  };
};

teacherScoreSchema.methods.addAchievement = function(type: 'badge' | 'milestone' | 'recognition' | 'award', achievement: string) {
  if (!this.achievements[type + 's'].includes(achievement)) {
    this.achievements[type + 's'].push(achievement);
  }
};

teacherScoreSchema.methods.setTargetScore = function(targetScore: number, actionPlan: string[], nextReviewDate?: Date) {
  this.goals.targetScore = targetScore;
  this.goals.targetAchieved = this.overallScore >= targetScore;
  this.goals.actionPlan = actionPlan;
  if (nextReviewDate) {
    this.goals.nextReviewDate = nextReviewDate;
  }
};

// Static Methods
teacherScoreSchema.statics.generateScoreId = function(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `SCORE-${year}-${randomNum}`;
};

teacherScoreSchema.statics.findByTeacher = function(teacherId: Types.ObjectId, periodType?: string) {
  const query: any = { teacherId };
  if (periodType) query.periodType = periodType;
  return this.find(query).sort({ periodStart: -1 });
};

teacherScoreSchema.statics.findCurrentPeriod = function(teacherId: Types.ObjectId) {
  const now = new Date();
  return this.findOne({
    teacherId,
    periodStart: { $lte: now },
    periodEnd: { $gte: now }
  });
};

teacherScoreSchema.statics.getLeaderboard = function(limit: number = 10, periodType?: string) {
  const matchStage: any = { status: 'final' };
  if (periodType) matchStage.periodType = periodType;
  
  return this.aggregate([
    { $match: matchStage },
    { $sort: { overallScore: -1, generatedAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher'
      }
    },
    { $unwind: '$teacher' },
    {
      $project: {
        scoreId: 1,
        overallScore: 1,
        scoreGrade: 1,
        periodStart: 1,
        periodEnd: 1,
        'teacher.firstName': 1,
        'teacher.lastName': 1,
        'teacher.email': 1,
        'analytics.ranking': 1
      }
    }
  ]);
};

// Pre-save middleware
teacherScoreSchema.pre('save', function(next) {
  if (this.isNew && !this.scoreId) {
    this.scoreId = (this.constructor as any).generateScoreId();
  }
  
  // Auto-calculate score grade
  const score = this.overallScore;
  if (score >= 97) this.scoreGrade = 'A+';
  else if (score >= 93) this.scoreGrade = 'A';
  else if (score >= 87) this.scoreGrade = 'B+';
  else if (score >= 83) this.scoreGrade = 'B';
  else if (score >= 77) this.scoreGrade = 'C+';
  else if (score >= 73) this.scoreGrade = 'C';
  else if (score >= 60) this.scoreGrade = 'D';
  else this.scoreGrade = 'F';
  
  // Calculate score change
  if (this.previousScore !== undefined) {
    this.scoreChange = this.overallScore - this.previousScore;
  }
  
  // Check target achievement
  this.goals.targetAchieved = this.overallScore >= this.goals.targetScore;
  
  next();
});

const TeacherScore = mongoose.model<ITeacherScore>('TeacherScore', teacherScoreSchema);

export default TeacherScore;
