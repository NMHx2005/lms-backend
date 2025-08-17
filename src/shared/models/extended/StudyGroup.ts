import mongoose, { Document, Schema } from 'mongoose';

// StudyGroup interface
export interface IStudyGroup extends Document {
  name: string;
  description?: string;
  courseId?: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  maxMembers?: number;
  isPrivate: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// StudyGroup schema
const studyGroupSchema = new Schema<IStudyGroup>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
      index: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: [],
    }],
    maxMembers: {
      type: Number,
      min: [2, 'Maximum members must be at least 2'],
      max: [100, 'Maximum members cannot exceed 100'],
      default: 20,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Each tag cannot exceed 50 characters'],
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
studyGroupSchema.index({ courseId: 1 });
studyGroupSchema.index({ creatorId: 1 });
studyGroupSchema.index({ isActive: 1 });
studyGroupSchema.index({ isPrivate: 1 });
studyGroupSchema.index({ tags: 1 });
studyGroupSchema.index({ createdAt: -1 });

// Virtual for creator
studyGroupSchema.virtual('creator', {
  ref: 'User',
  localField: 'creatorId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course
studyGroupSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for member count
studyGroupSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Virtual for isFull
studyGroupSchema.virtual('isFull').get(function () {
  return this.members.length >= (this.maxMembers || 20);
});

// Virtual for canJoin
studyGroupSchema.virtual('canJoin').get(function () {
  return this.isActive && this.members.length < (this.maxMembers || 20);
});

// Pre-save middleware to add creator to members
studyGroupSchema.pre('save', function (next) {
  if (this.isNew && !this.members.includes(this.creatorId)) {
    this.members.push(this.creatorId);
  }
  next();
});

// Pre-save middleware to validate member count
studyGroupSchema.pre('save', function (next) {
  if (this.members.length > (this.maxMembers || 20)) {
    return next(new Error('Member count exceeds maximum limit'));
  }
  next();
});

// Static method to find by course
studyGroupSchema.statics.findByCourse = function (
  courseId: mongoose.Types.ObjectId
) {
  return this.find({ courseId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find public groups
studyGroupSchema.statics.findPublic = function () {
  return this.find({ isPrivate: false, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find by creator
studyGroupSchema.statics.findByCreator = function (
  creatorId: mongoose.Types.ObjectId
) {
  return this.find({ creatorId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find by tags
studyGroupSchema.statics.findByTags = function (tags: string[]) {
  return this.find({
    tags: { $in: tags },
    isActive: true,
    isPrivate: false,
  }).sort({ createdAt: -1 });
};

// Instance method to add member
studyGroupSchema.methods.addMember = async function (
  userId: mongoose.Types.ObjectId
) {
  if (this.members.length >= (this.maxMembers || 20)) {
    throw new Error('Group is full');
  }
  
  if (this.members.includes(userId)) {
    throw new Error('User is already a member');
  }
  
  this.members.push(userId);
  await this.save();
};

// Instance method to remove member
studyGroupSchema.methods.removeMember = async function (
  userId: mongoose.Types.ObjectId
) {
  if (userId.equals(this.creatorId)) {
    throw new Error('Creator cannot be removed from group');
  }
  
  const index = this.members.indexOf(userId);
  if (index === -1) {
    throw new Error('User is not a member');
  }
  
  this.members.splice(index, 1);
  await this.save();
};

// Instance method to transfer ownership
studyGroupSchema.methods.transferOwnership = async function (
  newCreatorId: mongoose.Types.ObjectId
) {
  if (!this.members.includes(newCreatorId)) {
    throw new Error('New creator must be a member');
  }
  
  this.creatorId = newCreatorId;
  await this.save();
};

// Export the model
export default mongoose.model<IStudyGroup>('StudyGroup', studyGroupSchema);
