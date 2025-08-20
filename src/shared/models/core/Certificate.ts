import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface ICertificate extends Document {
  // Basic Information
  certificateId: string; // Unique human-readable ID (CERT-2024-001234)
  verificationCode: string; // Unique verification code for public verification
  qrCode: string; // QR code data for quick verification
  
  // Course & Student Information
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  instructorId: mongoose.Types.ObjectId;
  enrollmentId: mongoose.Types.ObjectId;
  
  // Achievement Data
  completionDate: Date;
  issueDate: Date;
  expiryDate?: Date; // Some certificates may expire
  finalScore: number; // Overall course score (0-100)
  timeSpent: number; // Total hours spent on course
  
  // Certificate Level & Type
  certificateType: 'completion' | 'achievement' | 'mastery' | 'professional' | 'expert';
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'pass';
  
  // Template & Design
  templateId: mongoose.Types.ObjectId;
  customization: {
    backgroundColor: string;
    borderColor: string;
    logoUrl?: string;
    signatureUrl?: string;
    watermarkUrl?: string;
  };
  
  // Requirements Met
  requirementsMet: {
    completionPercentage: number;
    assignmentsPassed: number;
    totalAssignments: number;
    minimumScore: number;
    achievedScore: number;
    timeRequirement: number;
    timeSpent: number;
    finalExamPassed?: boolean;
    finalExamScore?: number;
  };
  
  // Additional Achievements
  achievements: {
    name: string;
    description: string;
    iconUrl?: string;
    earnedDate: Date;
  }[];
  
  // Skills Earned
  skillsEarned: {
    skillName: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    verifiedDate: Date;
  }[];
  
  // Verification & Security
  isVerified: boolean;
  verificationHash: string; // Cryptographic hash for tamper detection
  blockchainHash?: string; // Optional blockchain verification
  ipfsHash?: string; // IPFS storage hash for decentralized verification
  
  // File Information
  pdfUrl: string; // Generated PDF file URL
  pdfPath: string; // Local file path
  imageUrl?: string; // Certificate as image (PNG/JPG)
  fileSize: number; // File size in bytes
  
  // Status & Validity
  status: 'active' | 'revoked' | 'expired' | 'replaced';
  isPublic: boolean; // Can be viewed publicly
  isShareable: boolean; // Can be shared on social media
  
  // Tracking & Analytics
  viewCount: number;
  downloadCount: number;
  shareCount: number;
  verificationCount: number;
  lastVerifiedAt?: Date;
  
  // Social Sharing
  linkedInShareUrl?: string;
  twitterShareUrl?: string;
  facebookShareUrl?: string;
  
  // Professional Recognition
  industryRecognition: {
    organizationName: string;
    recognitionLevel: string;
    validUntil?: Date;
  }[];
  
  // Metadata
  metadata: {
    courseTitle: string;
    courseDomain: string;
    courseLevel: string;
    instructorName: string;
    platformName: string;
    platformUrl: string;
    certificationBody?: string;
  };
  
  // Audit Trail
  auditLog: {
    action: string;
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
    details: string;
    ipAddress?: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual Properties
  isExpired: boolean;
  displayUrl: string;
  shareableUrl: string;
  
  // Instance Methods
  generateVerificationCode(): string;
  generateQRCode(): Promise<string>;
  calculateHash(): string;
  revoke(reason: string, adminId: mongoose.Types.ObjectId): Promise<void>;
  verify(): Promise<boolean>;
  incrementView(): Promise<void>;
  incrementDownload(): Promise<void>;
  addToBlockchain(): Promise<string>;
}

const certificateSchema = new Schema<ICertificate>({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  verificationCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  qrCode: {
    type: String,
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  instructorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  enrollmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
    index: true
  },
  completionDate: {
    type: Date,
    required: true,
    index: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    index: true
  },
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  certificateType: {
    type: String,
    enum: ['completion', 'achievement', 'mastery', 'professional', 'expert'],
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    required: true,
    index: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'pass'],
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'CertificateTemplate',
    required: true
  },
  customization: {
    backgroundColor: { type: String, default: '#ffffff' },
    borderColor: { type: String, default: '#000000' },
    logoUrl: String,
    signatureUrl: String,
    watermarkUrl: String
  },
  requirementsMet: {
    completionPercentage: { type: Number, required: true },
    assignmentsPassed: { type: Number, required: true },
    totalAssignments: { type: Number, required: true },
    minimumScore: { type: Number, required: true },
    achievedScore: { type: Number, required: true },
    timeRequirement: { type: Number, required: true },
    timeSpent: { type: Number, required: true },
    finalExamPassed: Boolean,
    finalExamScore: Number
  },
  achievements: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    iconUrl: String,
    earnedDate: { type: Date, required: true }
  }],
  skillsEarned: [{
    skillName: { type: String, required: true },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true
    },
    verifiedDate: { type: Date, required: true }
  }],
  isVerified: {
    type: Boolean,
    default: true
  },
  verificationHash: {
    type: String,
    required: true
  },
  blockchainHash: String,
  ipfsHash: String,
  pdfUrl: {
    type: String,
    required: true
  },
  pdfPath: {
    type: String,
    required: true
  },
  imageUrl: String,
  fileSize: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'replaced'],
    default: 'active',
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isShareable: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerifiedAt: Date,
  linkedInShareUrl: String,
  twitterShareUrl: String,
  facebookShareUrl: String,
  industryRecognition: [{
    organizationName: { type: String, required: true },
    recognitionLevel: { type: String, required: true },
    validUntil: Date
  }],
  metadata: {
    courseTitle: { type: String, required: true },
    courseDomain: { type: String, required: true },
    courseLevel: { type: String, required: true },
    instructorName: { type: String, required: true },
    platformName: { type: String, required: true },
    platformUrl: { type: String, required: true },
    certificationBody: String
  },
  auditLog: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    details: { type: String, required: true },
    ipAddress: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound Indexes for Performance
certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
certificateSchema.index({ certificateType: 1, level: 1 });
certificateSchema.index({ status: 1, isPublic: 1 });
certificateSchema.index({ issueDate: -1 });
certificateSchema.index({ completionDate: -1 });
certificateSchema.index({ 'metadata.courseDomain': 1 });

// Virtual for expiry check
certificateSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for display URL
certificateSchema.virtual('displayUrl').get(function() {
  return `${process.env.FRONTEND_URL}/certificates/${this.certificateId}`;
});

// Virtual for shareable URL
certificateSchema.virtual('shareableUrl').get(function() {
  return `${process.env.FRONTEND_URL}/verify/${this.verificationCode}`;
});

// Pre-save middleware to generate codes and hash
certificateSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique certificate ID
    if (!this.certificateId) {
      const year = new Date().getFullYear();
      const count = await Certificate.countDocuments();
      this.certificateId = `CERT-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    
    // Generate verification code
    if (!this.verificationCode) {
      this.verificationCode = this.generateVerificationCode();
    }
    
    // Generate verification hash
    this.verificationHash = this.calculateHash();
    
    // Add creation audit log
    this.auditLog.push({
      action: 'created',
      timestamp: new Date(),
      userId: this.studentId,
      details: 'Certificate generated automatically'
    });
  }
  
  next();
});

// Instance method to generate verification code
certificateSchema.methods.generateVerificationCode = function(): string {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

// Instance method to generate QR code data
certificateSchema.methods.generateQRCode = async function(): Promise<string> {
  const qrData = {
    certificateId: this.certificateId,
    verificationCode: this.verificationCode,
    verifyUrl: this.shareableUrl,
    hash: this.verificationHash
  };
  return JSON.stringify(qrData);
};

// Instance method to calculate verification hash
certificateSchema.methods.calculateHash = function(): string {
  const data = `${this.certificateId}${this.studentId}${this.courseId}${this.completionDate}${this.finalScore}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Instance method to revoke certificate
certificateSchema.methods.revoke = async function(reason: string, adminId: mongoose.Types.ObjectId): Promise<void> {
  this.status = 'revoked';
  this.auditLog.push({
    action: 'revoked',
    timestamp: new Date(),
    userId: adminId,
    details: `Certificate revoked: ${reason}`
  });
  await this.save();
};

// Instance method to verify certificate
certificateSchema.methods.verify = async function(): Promise<boolean> {
  if (this.status !== 'active') return false;
  if (this.isExpired) return false;
  
  const currentHash = this.calculateHash();
  const isValid = currentHash === this.verificationHash;
  
  if (isValid) {
    this.verificationCount += 1;
    this.lastVerifiedAt = new Date();
    await this.save();
  }
  
  return isValid;
};

// Instance method to increment view count
certificateSchema.methods.incrementView = async function(): Promise<void> {
  this.viewCount += 1;
  await this.save();
};

// Instance method to increment download count
certificateSchema.methods.incrementDownload = async function(): Promise<void> {
  this.downloadCount += 1;
  await this.save();
};

// Instance method to add to blockchain (placeholder)
certificateSchema.methods.addToBlockchain = async function(): Promise<string> {
  // Placeholder for blockchain integration
  // In real implementation, this would interact with blockchain API
  const blockchainHash = crypto.createHash('sha256').update(this.verificationHash).digest('hex');
  this.blockchainHash = blockchainHash;
  await this.save();
  return blockchainHash;
};

// Static method to find by verification code
certificateSchema.statics.findByVerificationCode = function(code: string) {
  return this.findOne({ verificationCode: code.toUpperCase(), status: 'active' });
};

// Static method to find by student
certificateSchema.statics.findByStudent = function(studentId: mongoose.Types.ObjectId) {
  return this.find({ studentId, status: 'active' }).sort({ issueDate: -1 });
};

// Static method to find by course
certificateSchema.statics.findByCourse = function(courseId: mongoose.Types.ObjectId) {
  return this.find({ courseId, status: 'active' }).sort({ issueDate: -1 });
};

// Static method to get statistics
certificateSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCertificates: { $sum: 1 },
        activeCertificates: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        revokedCertificates: {
          $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] }
        },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' },
        totalVerifications: { $sum: '$verificationCount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalCertificates: 0,
    activeCertificates: 0,
    revokedCertificates: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalVerifications: 0
  };
};

const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
export default Certificate;
