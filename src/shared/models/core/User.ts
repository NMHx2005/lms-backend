import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User interface
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: ('student' | 'teacher' | 'admin')[];
  role: 'student' | 'teacher' | 'admin';
  subscriptionPlan: 'free' | 'pro' | 'advanced';
  subscriptionExpiresAt?: Date;
  isActive: boolean;
  emailVerified: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  authProvider?: 'local' | 'google' | 'facebook' | 'github';
  registrationMethod?: 'email' | 'google_oauth' | 'facebook_oauth' | 'github_oauth';
  socialAccounts?: {
    google?: {
      id: string;
      email: string;
      accessToken: string;
      refreshToken: string;
      profile: any;
      linkedAt: Date;
      lastLogin: Date;
    };
    facebook?: {
      id: string;
      email: string;
      accessToken: string;
      profile: any;
      linkedAt: Date;
      lastLogin: Date;
    };
    github?: {
      id: string;
      email: string;
      accessToken: string;
      profile: any;
      linkedAt: Date;
      lastLogin: Date;
    };
  };
  refreshTokens?: Array<{
    token: string;
    createdAt: Date;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }>;
  loginAttempts?: number;
  accountLockedUntil?: Date;
  accountSettings?: {
    twoFactorEnabled: boolean;
    emailNotifications: boolean;
    marketingEmails: boolean;
    smsNotifications: boolean;
  };
  phone?: string;
  dateOfBirth?: Date;
  country?: string;
  bio?: string;
  address?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    youtube?: string;
  };
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  stats?: {
    totalCoursesEnrolled: number;
    totalCoursesCompleted: number;
    totalAssignmentsSubmitted: number;
    averageScore: number;
    totalLearningTime: number;
  };
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastActivity(): Promise<void>;
  updateLastLogin(): Promise<void>;
}

// User schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    roles: {
      type: [String],
      enum: ['student', 'teacher', 'admin'],
      default: ['student'],
      validate: {
        validator: function (roles: string[]) {
          return roles.length > 0;
        },
        message: 'User must have at least one role',
      },
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro', 'advanced'],
      default: 'free',
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'github'],
      default: 'local',
    },
    registrationMethod: {
      type: String,
      enum: ['email', 'google_oauth', 'facebook_oauth', 'github_oauth'],
      default: 'email',
    },
    socialAccounts: {
      google: {
        id: String,
        email: String,
        accessToken: String,
        refreshToken: String,
        profile: Schema.Types.Mixed,
        linkedAt: Date,
        lastLogin: Date,
      },
      facebook: {
        id: String,
        email: String,
        accessToken: String,
        profile: Schema.Types.Mixed,
        linkedAt: Date,
        lastLogin: Date,
      },
      github: {
        id: String,
        email: String,
        accessToken: String,
        profile: Schema.Types.Mixed,
        linkedAt: Date,
        lastLogin: Date,
      },
    },
    refreshTokens: [{
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
      userAgent: String,
      ipAddress: String,
    }],
    loginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
    accountSettings: {
      twoFactorEnabled: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (date: Date) {
          return date <= new Date();
        },
        message: 'Date of birth cannot be in the future',
      },
    },
    country: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String,
      youtube: String,
    },
    preferences: {
      language: {
        type: String,
        default: 'vi',
      },
      timezone: {
        type: String,
        default: 'Asia/Ho_Chi_Minh',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
    },
    stats: {
      totalCoursesEnrolled: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCoursesCompleted: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAssignmentsSubmitted: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      totalLearningTime: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'stats.totalCoursesEnrolled': -1 });
userSchema.index({ 'stats.averageScore': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (!this.firstName && !this.lastName) return this.name;
  if (this.firstName && this.lastName && this.firstName === this.lastName) return this.firstName;
  return `${this.firstName} ${this.lastName}`.trim();
});

// Helper to split Vietnamese full name into lastName (family) and firstName (given)
function splitVNName(fullName: string): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  const firstName = parts[parts.length - 1];
  const lastName = parts[0];
  return { firstName, lastName };
}

// Ensure firstName/lastName are synchronized with name
userSchema.pre('validate', function (next) {
  // If name provided or modified, always derive first/last from it
  if (this.name) {
    const derived = splitVNName(this.name);
    this.firstName = derived.firstName;
    this.lastName = derived.lastName;
  }

  // If name is missing but first/last exist, reconstruct name
  if (!this.name && (this.firstName || this.lastName)) {
    const left = this.lastName || '';
    const right = this.firstName || '';
    this.name = `${left} ${right}`.trim();
  }
  next();
});

// Virtual for subscription status
userSchema.virtual('subscriptionStatus').get(function () {
  if (!this.subscriptionExpiresAt) return 'active';
  return this.subscriptionExpiresAt > new Date() ? 'active' : 'expired';
});

// Virtual for isPremium
userSchema.virtual('isPremium').get(function () {
  return this.subscriptionPlan !== 'free';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to update timestamps
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update last activity
userSchema.methods.updateLastActivity = async function (): Promise<void> {
  this.lastActivityAt = new Date();
  await this.save();
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function (): Promise<void> {
  this.lastLoginAt = new Date();
  this.lastActivityAt = new Date();
  await this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find by role
userSchema.statics.findByRole = function (role: string) {
  return this.find({ roles: role });
};

// Export the model
const User = mongoose.model<IUser>('User', userSchema);
export { User };
export default User;
