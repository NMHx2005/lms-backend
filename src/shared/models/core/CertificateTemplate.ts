import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificateTemplate extends Document {
  // Basic Information
  name: string;
  description: string;
  category: 'professional' | 'academic' | 'skill-based' | 'corporate' | 'government';
  
  // Design Properties
  layout: 'landscape' | 'portrait';
  dimensions: {
    width: number;
    height: number;
    unit: 'px' | 'mm' | 'in';
  };
  
  // Background Design
  background: {
    type: 'color' | 'gradient' | 'image' | 'pattern';
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      direction?: string;
    };
    imageUrl?: string;
    pattern?: 'dots' | 'lines' | 'geometric' | 'watermark';
  };
  
  // Border & Frame
  border: {
    enabled: boolean;
    style: 'solid' | 'dashed' | 'dotted' | 'double' | 'ornamental';
    width: number;
    color: string;
    cornerRadius?: number;
    ornamentType?: 'classic' | 'modern' | 'decorative' | 'minimalist';
  };
  
  // Typography Settings
  typography: {
    title: {
      fontFamily: string;
      fontSize: number;
      fontWeight: 'normal' | 'bold' | 'bolder';
      color: string;
      textAlign: 'left' | 'center' | 'right';
      textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
      letterSpacing?: number;
      lineHeight?: number;
    };
    subtitle: {
      fontFamily: string;
      fontSize: number;
      fontWeight: 'normal' | 'bold' | 'bolder';
      color: string;
      textAlign: 'left' | 'center' | 'right';
      letterSpacing?: number;
    };
    body: {
      fontFamily: string;
      fontSize: number;
      fontWeight: 'normal' | 'bold';
      color: string;
      textAlign: 'left' | 'center' | 'right';
      lineHeight?: number;
    };
    accent: {
      fontFamily: string;
      fontSize: number;
      fontWeight: 'normal' | 'bold' | 'bolder';
      color: string;
    };
  };
  
  // Logo & Branding
  branding: {
    primaryLogo: {
      enabled: boolean;
      url?: string;
      position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
      size: { width: number; height: number };
      opacity?: number;
    };
    secondaryLogo: {
      enabled: boolean;
      url?: string;
      position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
      size: { width: number; height: number };
      opacity?: number;
    };
    watermark: {
      enabled: boolean;
      url?: string;
      opacity: number;
      position: 'center' | 'bottom-right' | 'full-background';
    };
  };
  
  // Content Layout
  layout_config: {
    header: {
      enabled: boolean;
      height: number;
      content: string; // HTML template
      style?: any;
    };
    body: {
      sections: {
        name: string;
        content: string; // HTML template with placeholders
        style?: any;
        order: number;
      }[];
    };
    footer: {
      enabled: boolean;
      height: number;
      content: string; // HTML template
      style?: any;
    };
    signature: {
      enabled: boolean;
      instructor: {
        enabled: boolean;
        position: 'left' | 'center' | 'right';
        showSignature: boolean;
        showName: boolean;
        showTitle: boolean;
        signatureImageUrl?: string;
      };
      admin: {
        enabled: boolean;
        position: 'left' | 'center' | 'right';
        showSignature: boolean;
        showName: boolean;
        showTitle: boolean;
        signatureImageUrl?: string;
      };
    };
  };
  
  // Dynamic Content Placeholders
  placeholders: {
    required: string[]; // e.g., ['STUDENT_NAME', 'COURSE_TITLE', 'COMPLETION_DATE']
    optional: string[]; // e.g., ['FINAL_SCORE', 'TIME_SPENT', 'INSTRUCTOR_NAME']
    custom: {
      name: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'image';
      defaultValue?: any;
    }[];
  };
  
  // Certificate Levels Support
  levelVariations: {
    level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
    };
    badge: {
      enabled: boolean;
      imageUrl?: string;
      position: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
      size: { width: number; height: number };
    };
    borderColor?: string;
    backgroundOverlay?: string;
  }[];
  
  // Security Features
  security: {
    qrCode: {
      enabled: boolean;
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      size: number;
      style: 'square' | 'round' | 'logo-embedded';
    };
    verificationCode: {
      enabled: boolean;
      position: 'header' | 'footer' | 'bottom-right';
      format: 'alphanumeric' | 'numeric' | 'custom';
      prefix?: string;
    };
    digitalSignature: {
      enabled: boolean;
      algorithm: 'RSA' | 'ECDSA';
      keySize: number;
    };
    tamperProof: {
      enabled: boolean;
      method: 'hash' | 'blockchain' | 'digital-signature';
    };
  };
  
  // Template Metadata
  metadata: {
    version: string;
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    isDefault: boolean;
    usageCount: number;
    lastUsed?: Date;
    tags: string[];
    industry: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedGenerationTime: number; // in milliseconds
  };
  
  // Preview & Samples
  preview: {
    thumbnailUrl?: string;
    samplePdfUrl?: string;
    previewImageUrl?: string;
  };
  
  // Compliance & Standards
  compliance: {
    standards: string[]; // e.g., ['ISO', 'ANSI', 'W3C']
    accessibility: {
      wcagLevel: 'A' | 'AA' | 'AAA';
      colorContrast: number;
      fontReadability: boolean;
    };
    dataProtection: {
      gdprCompliant: boolean;
      dataRetention: number; // days
      anonymization: boolean;
    };
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isPopular: boolean;
  
  // Instance methods
  generatePreview(): Promise<string>;
  validatePlaceholders(data: any): boolean;
  clone(): Promise<ICertificateTemplate>;
  incrementUsage(): Promise<void>;
}

const certificateTemplateSchema = new Schema<ICertificateTemplate>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['professional', 'academic', 'skill-based', 'corporate', 'government'],
    required: true,
    index: true
  },
  layout: {
    type: String,
    enum: ['landscape', 'portrait'],
    required: true
  },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    unit: { type: String, enum: ['px', 'mm', 'in'], default: 'px' }
  },
  background: {
    type: { type: String, enum: ['color', 'gradient', 'image', 'pattern'], required: true },
    color: String,
    gradient: {
      type: { type: String, enum: ['linear', 'radial'] },
      colors: [String],
      direction: String
    },
    imageUrl: String,
    pattern: { type: String, enum: ['dots', 'lines', 'geometric', 'watermark'] }
  },
  border: {
    enabled: { type: Boolean, default: true },
    style: { type: String, enum: ['solid', 'dashed', 'dotted', 'double', 'ornamental'], default: 'solid' },
    width: { type: Number, default: 2 },
    color: { type: String, default: '#000000' },
    cornerRadius: Number,
    ornamentType: { type: String, enum: ['classic', 'modern', 'decorative', 'minimalist'] }
  },
  typography: {
    title: {
      fontFamily: { type: String, default: 'Arial' },
      fontSize: { type: Number, default: 32 },
      fontWeight: { type: String, enum: ['normal', 'bold', 'bolder'], default: 'bold' },
      color: { type: String, default: '#000000' },
      textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
      textTransform: { type: String, enum: ['none', 'uppercase', 'lowercase', 'capitalize'], default: 'uppercase' },
      letterSpacing: Number,
      lineHeight: Number
    },
    subtitle: {
      fontFamily: { type: String, default: 'Arial' },
      fontSize: { type: Number, default: 18 },
      fontWeight: { type: String, enum: ['normal', 'bold', 'bolder'], default: 'normal' },
      color: { type: String, default: '#333333' },
      textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
      letterSpacing: Number
    },
    body: {
      fontFamily: { type: String, default: 'Arial' },
      fontSize: { type: Number, default: 14 },
      fontWeight: { type: String, enum: ['normal', 'bold'], default: 'normal' },
      color: { type: String, default: '#333333' },
      textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
      lineHeight: Number
    },
    accent: {
      fontFamily: { type: String, default: 'Arial' },
      fontSize: { type: Number, default: 16 },
      fontWeight: { type: String, enum: ['normal', 'bold', 'bolder'], default: 'bold' },
      color: { type: String, default: '#007bff' }
    }
  },
  branding: {
    primaryLogo: {
      enabled: { type: Boolean, default: true },
      url: String,
      position: { type: String, enum: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'], default: 'top-center' },
      size: {
        width: { type: Number, default: 100 },
        height: { type: Number, default: 100 }
      },
      opacity: { type: Number, default: 1, min: 0, max: 1 }
    },
    secondaryLogo: {
      enabled: { type: Boolean, default: false },
      url: String,
      position: { type: String, enum: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'], default: 'top-right' },
      size: {
        width: { type: Number, default: 80 },
        height: { type: Number, default: 80 }
      },
      opacity: { type: Number, default: 1, min: 0, max: 1 }
    },
    watermark: {
      enabled: { type: Boolean, default: false },
      url: String,
      opacity: { type: Number, default: 0.1, min: 0, max: 1 },
      position: { type: String, enum: ['center', 'bottom-right', 'full-background'], default: 'center' }
    }
  },
  layout_config: {
    header: {
      enabled: { type: Boolean, default: true },
      height: { type: Number, default: 100 },
      content: { type: String, required: true },
      style: Schema.Types.Mixed
    },
    body: {
      sections: [{
        name: { type: String, required: true },
        content: { type: String, required: true },
        style: Schema.Types.Mixed,
        order: { type: Number, required: true }
      }]
    },
    footer: {
      enabled: { type: Boolean, default: true },
      height: { type: Number, default: 80 },
      content: { type: String, required: true },
      style: Schema.Types.Mixed
    },
    signature: {
      enabled: { type: Boolean, default: true },
      instructor: {
        enabled: { type: Boolean, default: true },
        position: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
        showSignature: { type: Boolean, default: true },
        showName: { type: Boolean, default: true },
        showTitle: { type: Boolean, default: true },
        signatureImageUrl: String
      },
      admin: {
        enabled: { type: Boolean, default: false },
        position: { type: String, enum: ['left', 'center', 'right'], default: 'right' },
        showSignature: { type: Boolean, default: true },
        showName: { type: Boolean, default: true },
        showTitle: { type: Boolean, default: true },
        signatureImageUrl: String
      }
    }
  },
  placeholders: {
    required: { type: [String], default: ['STUDENT_NAME', 'COURSE_TITLE', 'COMPLETION_DATE'] },
    optional: { type: [String], default: ['FINAL_SCORE', 'TIME_SPENT', 'INSTRUCTOR_NAME'] },
    custom: [{
      name: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, enum: ['text', 'number', 'date', 'image'], required: true },
      defaultValue: Schema.Types.Mixed
    }]
  },
  levelVariations: [{
    level: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], required: true },
    colorScheme: {
      primary: { type: String, required: true },
      secondary: { type: String, required: true },
      accent: { type: String, required: true },
      text: { type: String, required: true }
    },
    badge: {
      enabled: { type: Boolean, default: false },
      imageUrl: String,
      position: { type: String, enum: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'], default: 'top-right' },
      size: {
        width: { type: Number, default: 60 },
        height: { type: Number, default: 60 }
      }
    },
    borderColor: String,
    backgroundOverlay: String
  }],
  security: {
    qrCode: {
      enabled: { type: Boolean, default: true },
      position: { type: String, enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], default: 'bottom-right' },
      size: { type: Number, default: 100 },
      style: { type: String, enum: ['square', 'round', 'logo-embedded'], default: 'square' }
    },
    verificationCode: {
      enabled: { type: Boolean, default: true },
      position: { type: String, enum: ['header', 'footer', 'bottom-right'], default: 'footer' },
      format: { type: String, enum: ['alphanumeric', 'numeric', 'custom'], default: 'alphanumeric' },
      prefix: String
    },
    digitalSignature: {
      enabled: { type: Boolean, default: false },
      algorithm: { type: String, enum: ['RSA', 'ECDSA'], default: 'RSA' },
      keySize: { type: Number, default: 2048 }
    },
    tamperProof: {
      enabled: { type: Boolean, default: true },
      method: { type: String, enum: ['hash', 'blockchain', 'digital-signature'], default: 'hash' }
    }
  },
  metadata: {
    version: { type: String, default: '1.0.0' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true, index: true },
    isDefault: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    lastUsed: Date,
    tags: { type: [String], index: true },
    industry: { type: [String], index: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedGenerationTime: { type: Number, default: 5000 }
  },
  preview: {
    thumbnailUrl: String,
    samplePdfUrl: String,
    previewImageUrl: String
  },
  compliance: {
    standards: { type: [String], default: [] },
    accessibility: {
      wcagLevel: { type: String, enum: ['A', 'AA', 'AAA'], default: 'AA' },
      colorContrast: { type: Number, default: 4.5 },
      fontReadability: { type: Boolean, default: true }
    },
    dataProtection: {
      gdprCompliant: { type: Boolean, default: true },
      dataRetention: { type: Number, default: 2555 }, // 7 years in days
      anonymization: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
certificateTemplateSchema.index({ category: 1, 'metadata.isActive': 1 });
certificateTemplateSchema.index({ 'metadata.tags': 1 });
certificateTemplateSchema.index({ 'metadata.usageCount': -1 });
certificateTemplateSchema.index({ 'metadata.industry': 1 });

// Virtual for popularity
certificateTemplateSchema.virtual('isPopular').get(function() {
  return this.metadata.usageCount > 100;
});

// Instance method to generate preview
certificateTemplateSchema.methods.generatePreview = async function(): Promise<string> {
  // This would integrate with a PDF/image generation service
  // For now, return placeholder
  return `${process.env.BASE_URL}/previews/template-${this._id}.png`;
};

// Instance method to validate placeholders
certificateTemplateSchema.methods.validatePlaceholders = function(data: any): boolean {
  for (const placeholder of this.placeholders.required) {
    if (!data[placeholder]) {
      return false;
    }
  }
  return true;
};

// Instance method to clone template
certificateTemplateSchema.methods.clone = async function(): Promise<ICertificateTemplate> {
  const cloned = new CertificateTemplate(this.toObject());
  cloned._id = new mongoose.Types.ObjectId();
  cloned.isNew = true;
  cloned.name = `${this.name} (Copy)`;
  cloned.metadata.usageCount = 0;
  cloned.metadata.lastUsed = undefined;
  delete (cloned as any).createdAt;
  delete (cloned as any).updatedAt;
  
  return cloned.save();
};

// Instance method to increment usage
certificateTemplateSchema.methods.incrementUsage = async function(): Promise<void> {
  this.metadata.usageCount += 1;
  this.metadata.lastUsed = new Date();
  await this.save();
};

// Static method to find popular templates
certificateTemplateSchema.statics.findPopular = function(limit: number = 10) {
  return this.find({ 'metadata.isActive': true })
    .sort({ 'metadata.usageCount': -1 })
    .limit(limit);
};

// Static method to find by category
certificateTemplateSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, 'metadata.isActive': true })
    .sort({ 'metadata.usageCount': -1 });
};

const CertificateTemplate = mongoose.model<ICertificateTemplate>('CertificateTemplate', certificateTemplateSchema);
export default CertificateTemplate;
