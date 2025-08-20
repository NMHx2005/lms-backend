import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificateRequirement extends Document {
  // Course Association
  courseId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  
  // Basic Requirements
  basicRequirements: {
    completionPercentage: number; // Minimum % to complete course (e.g., 100%)
    minimumTimeSpent: number; // Minimum hours spent on course
    attendanceRequired: boolean; // For live sessions
    minimumAttendanceRate?: number; // % of live sessions to attend
  };
  
  // Assessment Requirements
  assessmentRequirements: {
    assignmentsRequired: boolean;
    minimumAssignmentScore: number; // Average score required for assignments
    assignmentsToPass: number; // How many assignments must be completed
    totalAssignments: number; // Total assignments in course
    
    finalExam: {
      required: boolean;
      minimumScore: number; // Minimum score to pass final exam
      attemptsAllowed: number; // Number of attempts allowed
      timeLimit?: number; // Time limit in minutes
    };
    
    practicalAssessment: {
      required: boolean;
      type: 'project' | 'presentation' | 'portfolio' | 'lab';
      minimumScore: number;
      peerReviewRequired?: boolean;
      instructorApprovalRequired?: boolean;
    };
    
    continuousAssessment: {
      enabled: boolean;
      minimumParticipation: number; // % participation in discussions/activities
      quizScore: number; // Average quiz score required
      homeworkCompletion: number; // % of homework that must be completed
    };
  };
  
  // Skill Verification
  skillRequirements: {
    skillsToMaster: {
      skillName: string;
      minimumLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      verificationMethod: 'assignment' | 'quiz' | 'project' | 'peer-review';
      weight: number; // Weight in overall skill assessment
    }[];
    
    practicalSkills: {
      handsOnProjects: number; // Number of practical projects required
      codeReviews?: number; // For programming courses
      presentations?: number; // For communication courses
      portfolioItems?: number; // Portfolio pieces required
    };
    
    softSkills: {
      communication: boolean;
      teamwork: boolean;
      problemSolving: boolean;
      timeManagement: boolean;
    };
  };
  
  // Time-based Requirements
  timeRequirements: {
    minimumStudyPeriod: number; // Minimum days between enrollment and completion
    maximumStudyPeriod?: number; // Maximum time allowed to complete
    sessionRequirements: {
      minimumSessions: number; // Minimum number of study sessions
      sessionDuration: number; // Minimum duration per session (minutes)
      spreadRequirement: boolean; // Must spread learning over multiple days
    };
    
    deadlines: {
      enrollmentDeadline?: Date;
      completionDeadline?: Date;
      specificMilestones: {
        name: string;
        deadline: Date;
        required: boolean;
      }[];
    };
  };
  
  // Quality Requirements
  qualityRequirements: {
    engagementMetrics: {
      forumParticipation: number; // Number of forum posts/comments required
      videoWatchTime: number; // % of videos that must be watched
      resourceDownloads: number; // % of resources that must be accessed
      notesTaking: boolean; // Whether note-taking is required
    };
    
    peerInteraction: {
      peerReviews: number; // Number of peer reviews to give
      groupProjects: number; // Number of group projects to participate in
      mentoring: boolean; // Whether mentoring junior learners is required
      communityContribution: boolean; // Contributing to course community
    };
    
    qualityMetrics: {
      avgAssignmentQuality: number; // Minimum quality score for assignments
      originalityRequired: boolean; // Whether work must be original
      citationStandards: boolean; // Whether proper citations are required
      professionalStandards: boolean; // Whether professional standards apply
    };
  };
  
  // Industry-Specific Requirements
  industryRequirements: {
    industry: string[]; // Industries this certificate applies to
    professionalStandards: string[]; // Professional standards to meet
    certificationBodies: string[]; // External certification bodies involved
    
    complianceRequirements: {
      regulatoryCompliance: string[]; // Regulatory requirements to meet
      ethicsTraining: boolean; // Whether ethics training is required
      safetyTraining: boolean; // Whether safety training is required
      continuingEducation: {
        required: boolean;
        hoursPerYear?: number; // CE hours required annually
        renewalPeriod?: number; // Years between renewal
      };
    };
    
    experienceRequirements: {
      prerequisiteExperience: number; // Months of experience required
      portfolioRequired: boolean; // Whether portfolio is required
      recommendationsRequired: number; // Number of recommendations needed
      backgroundCheck: boolean; // Whether background check is required
    };
  };
  
  // Verification & Security
  verificationRequirements: {
    identityVerification: {
      required: boolean;
      method: 'government-id' | 'biometric' | 'video-call' | 'proctored-exam';
      documents: string[]; // Required identity documents
    };
    
    proctoring: {
      required: boolean;
      type: 'live' | 'recorded' | 'ai-proctored' | 'lockdown-browser';
      examSessions: string[]; // Which exams require proctoring
    };
    
    antiCheat: {
      plagiarismCheck: boolean;
      browserLockdown: boolean;
      timeTracking: boolean;
      screenRecording: boolean;
    };
  };
  
  // Certificate Levels Configuration
  levelConfiguration: {
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    requirements: {
      scoreThreshold: number; // Minimum score for this level
      bonusRequirements: string[]; // Additional requirements for higher levels
      timeBonus: boolean; // Whether completing early gives bonus
      excellenceMarkers: string[]; // Markers of excellence for this level
    };
  }[];
  
  // Flexibility & Accommodations
  accommodations: {
    disabilityAccommodations: {
      extraTime: boolean; // Whether extra time can be granted
      alternativeFormats: boolean; // Whether alternative formats are available
      assistiveTechnology: boolean; // Whether assistive tech is supported
      modifiedAssessments: boolean; // Whether assessments can be modified
    };
    
    languageSupport: {
      multilingualSupport: boolean;
      translationAllowed: boolean;
      nativeLanguageAssessment: boolean;
    };
    
    flexibleDeadlines: {
      extensionsAllowed: boolean;
      emergencyExtensions: boolean;
      maximumExtension: number; // Maximum days extension allowed
    };
  };
  
  // Analytics & Improvement
  analytics: {
    successRate: number; // % of students who meet requirements
    averageCompletionTime: number; // Average time to complete
    commonFailurePoints: string[]; // Where students commonly fail
    difficultyRating: number; // 1-10 difficulty rating
    
    continuousImprovement: {
      lastReviewed: Date;
      nextReviewDate: Date;
      feedbackIncorporated: boolean;
      adjustmentHistory: {
        date: Date;
        changes: string;
        reason: string;
        results: string;
      }[];
    };
  };
  
  // Metadata
  metadata: {
    version: string;
    createdBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    isActive: boolean;
    effectiveDate: Date;
    expirationDate?: Date;
    
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedCompletionTime: number; // Estimated hours to complete
    
    compliance: {
      accreditationBody?: string;
      standardsCompliance: string[];
      lastAudit?: Date;
      nextAudit?: Date;
    };
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isCurrentlyActive: boolean;
  difficultyLevel: string;
  
  // Instance methods
  checkStudentEligibility(enrollment: any): Promise<boolean>;
  calculateCompletionProgress(enrollment: any): Promise<number>;
  validateRequirements(): boolean;
  clone(): Promise<ICertificateRequirement>;
  updateAnalytics(): Promise<void>;
}

const certificateRequirementSchema = new Schema<ICertificateRequirement>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'CertificateTemplate',
    required: true
  },
  basicRequirements: {
    completionPercentage: { type: Number, required: true, min: 0, max: 100, default: 100 },
    minimumTimeSpent: { type: Number, required: true, min: 0, default: 0 },
    attendanceRequired: { type: Boolean, default: false },
    minimumAttendanceRate: { type: Number, min: 0, max: 100 }
  },
  assessmentRequirements: {
    assignmentsRequired: { type: Boolean, default: true },
    minimumAssignmentScore: { type: Number, min: 0, max: 100, default: 70 },
    assignmentsToPass: { type: Number, min: 0, default: 0 },
    totalAssignments: { type: Number, min: 0, default: 0 },
    
    finalExam: {
      required: { type: Boolean, default: false },
      minimumScore: { type: Number, min: 0, max: 100, default: 70 },
      attemptsAllowed: { type: Number, min: 1, default: 3 },
      timeLimit: Number
    },
    
    practicalAssessment: {
      required: { type: Boolean, default: false },
      type: { type: String, enum: ['project', 'presentation', 'portfolio', 'lab'] },
      minimumScore: { type: Number, min: 0, max: 100, default: 70 },
      peerReviewRequired: { type: Boolean, default: false },
      instructorApprovalRequired: { type: Boolean, default: true }
    },
    
    continuousAssessment: {
      enabled: { type: Boolean, default: false },
      minimumParticipation: { type: Number, min: 0, max: 100, default: 80 },
      quizScore: { type: Number, min: 0, max: 100, default: 70 },
      homeworkCompletion: { type: Number, min: 0, max: 100, default: 90 }
    }
  },
  skillRequirements: {
    skillsToMaster: [{
      skillName: { type: String, required: true },
      minimumLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], required: true },
      verificationMethod: { type: String, enum: ['assignment', 'quiz', 'project', 'peer-review'], required: true },
      weight: { type: Number, min: 0, max: 100, required: true }
    }],
    
    practicalSkills: {
      handsOnProjects: { type: Number, min: 0, default: 0 },
      codeReviews: { type: Number, min: 0 },
      presentations: { type: Number, min: 0 },
      portfolioItems: { type: Number, min: 0 }
    },
    
    softSkills: {
      communication: { type: Boolean, default: false },
      teamwork: { type: Boolean, default: false },
      problemSolving: { type: Boolean, default: false },
      timeManagement: { type: Boolean, default: false }
    }
  },
  timeRequirements: {
    minimumStudyPeriod: { type: Number, min: 1, default: 7 }, // days
    maximumStudyPeriod: Number,
    sessionRequirements: {
      minimumSessions: { type: Number, min: 1, default: 1 },
      sessionDuration: { type: Number, min: 1, default: 30 }, // minutes
      spreadRequirement: { type: Boolean, default: false }
    },
    
    deadlines: {
      enrollmentDeadline: Date,
      completionDeadline: Date,
      specificMilestones: [{
        name: { type: String, required: true },
        deadline: { type: Date, required: true },
        required: { type: Boolean, default: true }
      }]
    }
  },
  qualityRequirements: {
    engagementMetrics: {
      forumParticipation: { type: Number, min: 0, default: 0 },
      videoWatchTime: { type: Number, min: 0, max: 100, default: 80 },
      resourceDownloads: { type: Number, min: 0, max: 100, default: 50 },
      notesTaking: { type: Boolean, default: false }
    },
    
    peerInteraction: {
      peerReviews: { type: Number, min: 0, default: 0 },
      groupProjects: { type: Number, min: 0, default: 0 },
      mentoring: { type: Boolean, default: false },
      communityContribution: { type: Boolean, default: false }
    },
    
    qualityMetrics: {
      avgAssignmentQuality: { type: Number, min: 0, max: 100, default: 70 },
      originalityRequired: { type: Boolean, default: true },
      citationStandards: { type: Boolean, default: false },
      professionalStandards: { type: Boolean, default: false }
    }
  },
  industryRequirements: {
    industry: { type: [String], default: [] },
    professionalStandards: { type: [String], default: [] },
    certificationBodies: { type: [String], default: [] },
    
    complianceRequirements: {
      regulatoryCompliance: { type: [String], default: [] },
      ethicsTraining: { type: Boolean, default: false },
      safetyTraining: { type: Boolean, default: false },
      continuingEducation: {
        required: { type: Boolean, default: false },
        hoursPerYear: Number,
        renewalPeriod: Number
      }
    },
    
    experienceRequirements: {
      prerequisiteExperience: { type: Number, default: 0 },
      portfolioRequired: { type: Boolean, default: false },
      recommendationsRequired: { type: Number, default: 0 },
      backgroundCheck: { type: Boolean, default: false }
    }
  },
  verificationRequirements: {
    identityVerification: {
      required: { type: Boolean, default: false },
      method: { type: String, enum: ['government-id', 'biometric', 'video-call', 'proctored-exam'] },
      documents: { type: [String], default: [] }
    },
    
    proctoring: {
      required: { type: Boolean, default: false },
      type: { type: String, enum: ['live', 'recorded', 'ai-proctored', 'lockdown-browser'] },
      examSessions: { type: [String], default: [] }
    },
    
    antiCheat: {
      plagiarismCheck: { type: Boolean, default: true },
      browserLockdown: { type: Boolean, default: false },
      timeTracking: { type: Boolean, default: true },
      screenRecording: { type: Boolean, default: false }
    }
  },
  levelConfiguration: [{
    level: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], required: true },
    requirements: {
      scoreThreshold: { type: Number, min: 0, max: 100, required: true },
      bonusRequirements: { type: [String], default: [] },
      timeBonus: { type: Boolean, default: false },
      excellenceMarkers: { type: [String], default: [] }
    }
  }],
  accommodations: {
    disabilityAccommodations: {
      extraTime: { type: Boolean, default: false },
      alternativeFormats: { type: Boolean, default: false },
      assistiveTechnology: { type: Boolean, default: false },
      modifiedAssessments: { type: Boolean, default: false }
    },
    
    languageSupport: {
      multilingualSupport: { type: Boolean, default: false },
      translationAllowed: { type: Boolean, default: false },
      nativeLanguageAssessment: { type: Boolean, default: false }
    },
    
    flexibleDeadlines: {
      extensionsAllowed: { type: Boolean, default: true },
      emergencyExtensions: { type: Boolean, default: true },
      maximumExtension: { type: Number, default: 30 } // days
    }
  },
  analytics: {
    successRate: { type: Number, min: 0, max: 100, default: 0 },
    averageCompletionTime: { type: Number, default: 0 },
    commonFailurePoints: { type: [String], default: [] },
    difficultyRating: { type: Number, min: 1, max: 10, default: 5 },
    
    continuousImprovement: {
      lastReviewed: { type: Date, default: Date.now },
      nextReviewDate: Date,
      feedbackIncorporated: { type: Boolean, default: false },
      adjustmentHistory: [{
        date: { type: Date, default: Date.now },
        changes: { type: String, required: true },
        reason: { type: String, required: true },
        results: String
      }]
    }
  },
  metadata: {
    version: { type: String, default: '1.0.0' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true, index: true },
    effectiveDate: { type: Date, default: Date.now },
    expirationDate: Date,
    
    tags: { type: [String], index: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'intermediate' },
    estimatedCompletionTime: { type: Number, default: 40 }, // hours
    
    compliance: {
      accreditationBody: String,
      standardsCompliance: { type: [String], default: [] },
      lastAudit: Date,
      nextAudit: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
certificateRequirementSchema.index({ courseId: 1, 'metadata.isActive': 1 }, { unique: true });
certificateRequirementSchema.index({ 'metadata.difficulty': 1, 'analytics.successRate': -1 });
certificateRequirementSchema.index({ 'metadata.tags': 1 });

// Virtual for current activity
certificateRequirementSchema.virtual('isCurrentlyActive').get(function() {
  if (!this.metadata.isActive) return false;
  if (this.metadata.expirationDate && new Date() > this.metadata.expirationDate) return false;
  return new Date() >= this.metadata.effectiveDate;
});

// Virtual for difficulty level description
certificateRequirementSchema.virtual('difficultyLevel').get(function() {
  const descriptions = {
    'beginner': 'Entry-level requirements suitable for newcomers',
    'intermediate': 'Moderate requirements for learners with some experience', 
    'advanced': 'Challenging requirements for experienced learners',
    'expert': 'Rigorous requirements for professional certification'
  };
  return descriptions[this.metadata.difficulty] || 'Unknown difficulty';
});

// Instance method to check student eligibility
certificateRequirementSchema.methods.checkStudentEligibility = async function(enrollment: any): Promise<boolean> {
  // Basic completion check
  if (enrollment.progress < this.basicRequirements.completionPercentage) {
    return false;
  }
  
  // Time spent check
  if (enrollment.totalTimeSpent < this.basicRequirements.minimumTimeSpent) {
    return false;
  }
  
  // Additional checks would be implemented here
  // - Assignment scores
  // - Final exam results
  // - Practical assessments
  // - Skill verifications
  
  return true;
};

// Instance method to calculate completion progress
certificateRequirementSchema.methods.calculateCompletionProgress = async function(enrollment: any): Promise<number> {
  const checks = [];
  
  // Basic completion
  const completionProgress = Math.min(enrollment.progress / this.basicRequirements.completionPercentage, 1) * 40;
  checks.push(completionProgress);
  
  // Time spent
  const timeProgress = Math.min(enrollment.totalTimeSpent / this.basicRequirements.minimumTimeSpent, 1) * 20;
  checks.push(timeProgress);
  
  // Assignment scores (placeholder)
  const assignmentProgress = 20; // Would calculate based on actual assignments
  checks.push(assignmentProgress);
  
  // Skills (placeholder) 
  const skillsProgress = 20; // Would calculate based on skill assessments
  checks.push(skillsProgress);
  
  return checks.reduce((sum, score) => sum + score, 0);
};

// Instance method to validate requirements
certificateRequirementSchema.methods.validateRequirements = function(): boolean {
  // Check that all required fields are properly configured
  if (this.basicRequirements.completionPercentage < 0 || this.basicRequirements.completionPercentage > 100) {
    return false;
  }
  
  // Validate level configurations
  for (const level of this.levelConfiguration) {
    if (level.requirements.scoreThreshold < 0 || level.requirements.scoreThreshold > 100) {
      return false;
    }
  }
  
  // Additional validation logic would go here
  return true;
};

// Instance method to clone requirements
certificateRequirementSchema.methods.clone = async function(): Promise<ICertificateRequirement> {
  const cloned = new CertificateRequirement(this.toObject());
  cloned._id = new mongoose.Types.ObjectId();
  cloned.isNew = true;
  cloned.metadata.version = '1.0.0';
  delete (cloned as any).createdAt;
  delete (cloned as any).updatedAt;
  
  return cloned.save();
};

// Instance method to update analytics
certificateRequirementSchema.methods.updateAnalytics = async function(): Promise<void> {
  // This would calculate success rates, completion times, etc.
  // based on actual certificate issuance data
  
  // Placeholder implementation
  this.analytics.lastReviewed = new Date();
  await this.save();
};

// Static method to find by course
certificateRequirementSchema.statics.findByCourse = function(courseId: mongoose.Types.ObjectId) {
  return this.findOne({ courseId, 'metadata.isActive': true });
};

// Static method to find by difficulty
certificateRequirementSchema.statics.findByDifficulty = function(difficulty: string) {
  return this.find({ 'metadata.difficulty': difficulty, 'metadata.isActive': true });
};

const CertificateRequirement = mongoose.model<ICertificateRequirement>('CertificateRequirement', certificateRequirementSchema);
export default CertificateRequirement;
