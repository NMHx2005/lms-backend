import mongoose, { Schema, Document } from 'mongoose';

export interface IAIEvaluation extends Document {
  courseId: mongoose.Types.ObjectId;
  submittedBy: {
    userId: mongoose.Types.ObjectId;
    name: string;
    role: string;
  };
  submittedAt: Date;
  
  // Instance methods
  addLog(stage: string, message: string, error?: string): Promise<IAIEvaluation>;
  markAICompleted(analysisData: any): Promise<IAIEvaluation>;
  markFailed(error: string): Promise<IAIEvaluation>;
  
  // AI Analysis Results
  aiAnalysis: {
    overallScore: number; // 0-100
    contentQuality: {
      score: number;
      feedback: string;
      issues: string[];
    };
    structureQuality: {
      score: number;
      feedback: string;
      issues: string[];
    };
    educationalValue: {
      score: number;
      feedback: string;
      issues: string[];
    };
    completeness: {
      score: number;
      feedback: string;
      issues: string[];
    };
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
  };
  
  // Admin Review
  adminReview: {
    reviewedBy?: {
      userId: mongoose.Types.ObjectId;
      name: string;
    };
    reviewedAt?: Date;
    decision: 'pending' | 'approved' | 'rejected' | 'needs_revision';
    adminScore?: number; // 0-100
    adminFeedback?: string;
    adminComments?: string;
    revisionRequested?: {
      sections: string[];
      details: string;
      deadline?: Date;
    };
  };
  
  // Processing Status
  status: 'processing' | 'ai_completed' | 'admin_review' | 'completed' | 'failed';
  processingLogs: {
    timestamp: Date;
    stage: string;
    message: string;
    error?: string;
  }[];
  
  // Metrics
  processingTime: number; // milliseconds
  aiModelVersion: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const AIEvaluationSchema = new Schema<IAIEvaluation>({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  submittedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // AI Analysis Results
  aiAnalysis: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    contentQuality: {
      score: { type: Number, min: 0, max: 100, required: true },
      feedback: { type: String, required: true },
      issues: [{ type: String }]
    },
    structureQuality: {
      score: { type: Number, min: 0, max: 100, required: true },
      feedback: { type: String, required: true },
      issues: [{ type: String }]
    },
    educationalValue: {
      score: { type: Number, min: 0, max: 100, required: true },
      feedback: { type: String, required: true },
      issues: [{ type: String }]
    },
    completeness: {
      score: { type: Number, min: 0, max: 100, required: true },
      feedback: { type: String, required: true },
      issues: [{ type: String }]
    },
    recommendations: [{ type: String }],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }]
  },
  
  // Admin Review
  adminReview: {
    reviewedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_revision'],
      default: 'pending',
      index: true
    },
    adminScore: {
      type: Number,
      min: 0,
      max: 100
    },
    adminFeedback: String,
    adminComments: String,
    revisionRequested: {
      sections: [{ type: String }],
      details: String,
      deadline: Date
    }
  },
  
  // Processing Status
  status: {
    type: String,
    enum: ['processing', 'ai_completed', 'admin_review', 'completed', 'failed'],
    default: 'processing',
    index: true
  },
  processingLogs: [{
    timestamp: { type: Date, default: Date.now },
    stage: { type: String, required: true },
    message: { type: String, required: true },
    error: String
  }],
  
  // Metrics
  processingTime: {
    type: Number,
    default: 0
  },
  aiModelVersion: {
    type: String,
    default: 'gpt-4-turbo'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
AIEvaluationSchema.index({ courseId: 1, status: 1 });
AIEvaluationSchema.index({ 'submittedBy.userId': 1, submittedAt: -1 });
AIEvaluationSchema.index({ 'adminReview.decision': 1, submittedAt: -1 });
AIEvaluationSchema.index({ status: 1, submittedAt: -1 });

// Virtual for evaluation age
AIEvaluationSchema.virtual('evaluationAge').get(function() {
  return Date.now() - this.submittedAt.getTime();
});

// Virtual for is urgent (pending > 24 hours)
AIEvaluationSchema.virtual('isUrgent').get(function() {
  const hoursSinceSubmission = (Date.now() - this.submittedAt.getTime()) / (1000 * 60 * 60);
  return this.adminReview.decision === 'pending' && hoursSinceSubmission > 24;
});

// Instance Methods
AIEvaluationSchema.methods.addLog = function(stage: string, message: string, error?: string) {
  this.processingLogs.push({
    timestamp: new Date(),
    stage,
    message,
    error
  });
  return this.save();
};

AIEvaluationSchema.methods.markAICompleted = function(analysisData: any) {
  this.aiAnalysis = analysisData;
  this.status = 'ai_completed';
  this.adminReview.decision = 'pending';
  return this.addLog('ai_analysis', 'AI analysis completed successfully');
};

AIEvaluationSchema.methods.markFailed = function(error: string) {
  this.status = 'failed';
  return this.addLog('error', 'Processing failed', error);
};

// Static Methods
AIEvaluationSchema.statics.findPendingReviews = function() {
  return this.find({
    status: 'ai_completed',
    'adminReview.decision': 'pending'
  }).sort({ submittedAt: 1 });
};

AIEvaluationSchema.statics.findByTeacher = function(teacherId: string) {
  return this.find({
    'submittedBy.userId': teacherId
  }).sort({ submittedAt: -1 });
};

AIEvaluationSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$adminReview.decision',
        count: { $sum: 1 },
        avgScore: { $avg: '$aiAnalysis.overallScore' },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
};

const AIEvaluation = mongoose.model<IAIEvaluation>('AIEvaluation', AIEvaluationSchema);

export default AIEvaluation;
