import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComment {
  _id: Types.ObjectId;
  commentId: string;
  content: string;
  authorId: Types.ObjectId;
  authorType: 'student' | 'teacher' | 'admin';
  contentType: 'course' | 'lesson' | 'discussion' | 'assignment';
  contentId: Types.ObjectId;
  parentId?: Types.ObjectId; // For nested comments
  rootId?: Types.ObjectId; // Top-level comment ID
  
  // Moderation
  isApproved: boolean;
  isModerated: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationReason?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  
  // Engagement
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  helpfulVotes: number;
  totalVotes: number;
  
  // Reporting
  reports: Array<{
    reporterId: Types.ObjectId;
    reason: 'spam' | 'inappropriate' | 'harassment' | 'other';
    description?: string;
    reportedAt: Date;
    status: 'pending' | 'resolved' | 'dismissed';
  }>;
  
  // Metadata
  isEdited: boolean;
  editedAt?: Date;
  editHistory: Array<{
    content: string;
    editedAt: Date;
    reason?: string;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  replies?: IComment[];
  author?: any;
  
  // Instance methods
  addLike(userId: Types.ObjectId): Promise<void>;
  removeLike(userId: Types.ObjectId): Promise<void>;
  addDislike(userId: Types.ObjectId): Promise<void>;
  removeDislike(userId: Types.ObjectId): Promise<void>;
  addReport(reporterId: Types.ObjectId, reason: string, description?: string): Promise<void>;
  markAsHelpful(userId: Types.ObjectId): Promise<void>;
  editContent(newContent: string, reason?: string): Promise<void>;
  approve(moderatorId: Types.ObjectId, reason?: string): Promise<void>;
  reject(moderatorId: Types.ObjectId, reason: string): Promise<void>;
  flag(moderatorId: Types.ObjectId, reason: string): Promise<void>;
}

const commentSchema = new Schema<IComment>({
  commentId: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  authorId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  authorType: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  contentType: {
    type: String,
    enum: ['course', 'lesson', 'discussion', 'assignment'],
    required: true
  },
  contentId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  rootId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  
  // Moderation
  isApproved: {
    type: Boolean,
    default: true
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationReason: {
    type: String,
    trim: true
  },
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  
  // Engagement
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpfulVotes: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  
  // Reporting
  reports: [{
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'other'],
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  
  // Metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  editHistory: [{
    content: {
      type: String,
      required: true
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
commentSchema.index({ contentId: 1, contentType: 1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ rootId: 1 });
commentSchema.index({ authorId: 1 });
commentSchema.index({ moderationStatus: 1 });
commentSchema.index({ createdAt: -1 });

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentId'
});

// Virtual for author
commentSchema.virtual('author', {
  ref: 'User',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true
});

// Virtual for content
commentSchema.virtual('content', {
  refPath: 'contentType',
  localField: 'contentId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
commentSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate commentId
    this.commentId = `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set rootId if this is a top-level comment
    if (!this.parentId) {
      this.rootId = this._id;
    }
  }
  
  // Update totalVotes
  this.totalVotes = this.likes.length + this.dislikes.length;
  
  next();
});

// Instance methods
commentSchema.methods.addLike = async function(userId: Types.ObjectId): Promise<void> {
  if (this.likes.includes(userId)) {
    this.likes = this.likes.filter((id: Types.ObjectId) => !id.equals(userId));
  } else {
    this.likes.push(userId);
    // Remove from dislikes if exists
    this.dislikes = this.dislikes.filter((id: Types.ObjectId) => !id.equals(userId));
  }
  await this.save();
};

commentSchema.methods.removeLike = async function(userId: Types.ObjectId): Promise<void> {
  this.likes = this.likes.filter((id: Types.ObjectId) => !id.equals(userId));
  await this.save();
};

commentSchema.methods.addDislike = async function(userId: Types.ObjectId): Promise<void> {
  if (this.dislikes.includes(userId)) {
    this.dislikes = this.dislikes.filter((id: Types.ObjectId) => !id.equals(userId));
  } else {
    this.dislikes.push(userId);
    // Remove from likes if exists
    this.likes = this.likes.filter((id: Types.ObjectId) => !id.equals(userId));
  }
  await this.save();
};

commentSchema.methods.removeDislike = async function(userId: Types.ObjectId): Promise<void> {
  this.dislikes = this.dislikes.filter((id: Types.ObjectId) => !id.equals(userId));
  await this.save();
};

commentSchema.methods.addReport = async function(
  reporterId: Types.ObjectId, 
  reason: string, 
  description?: string
): Promise<void> {
  // Check if user already reported
  const existingReport = this.reports.find((report: any) => 
    report.reporterId.equals(reporterId) && report.status === 'pending'
  );
  
  if (!existingReport) {
    this.reports.push({
      reporterId,
      reason: reason as any,
      description,
      reportedAt: new Date(),
      status: 'pending'
    });
    
    // Auto-flag if multiple reports
    if (this.reports.filter((r: any) => r.status === 'pending').length >= 3) {
      this.moderationStatus = 'flagged';
      this.isModerated = true;
    }
    
    await this.save();
  }
};

commentSchema.methods.markAsHelpful = async function(userId: Types.ObjectId): Promise<void> {
  this.helpfulVotes += 1;
  await this.save();
};

commentSchema.methods.editContent = async function(newContent: string, reason?: string): Promise<void> {
  // Save current content to history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date(),
    reason
  });
  
  // Update content
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  
  await this.save();
};

commentSchema.methods.approve = async function(moderatorId: Types.ObjectId, reason?: string): Promise<void> {
  this.moderationStatus = 'approved';
  this.isModerated = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
  
  await this.save();
};

commentSchema.methods.reject = async function(moderatorId: Types.ObjectId, reason: string): Promise<void> {
  this.moderationStatus = 'rejected';
  this.isModerated = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
  
  await this.save();
};

commentSchema.methods.flag = async function(moderatorId: Types.ObjectId, reason: string): Promise<void> {
  this.moderationStatus = 'flagged';
  this.isModerated = true;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationReason = reason;
  
  await this.save();
};

export default mongoose.model<IComment>('Comment', commentSchema);
