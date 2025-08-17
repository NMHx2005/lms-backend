import mongoose, { Document, Schema } from 'mongoose';

// AdminPermission interface
export interface IAdminPermission extends Document {
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AdminPermission schema
const adminPermissionSchema = new Schema<IAdminPermission>(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Permission slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      enum: {
        values: [
          'users',
          'courses',
          'sections',
          'lessons',
          'assignments',
          'submissions',
          'enrollments',
          'bills',
          'refunds',
          'support',
          'analytics',
          'system',
          'permissions',
          'roles',
          'announcements',
          'categories',
          'notifications',
          'reports'
        ],
        message: 'Please select a valid resource',
      },
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      enum: {
        values: ['create', 'read', 'update', 'delete', 'approve', 'reject', 'assign', 'process'],
        message: 'Please select a valid action',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
adminPermissionSchema.index({ slug: 1 }, { unique: true });
adminPermissionSchema.index({ resource: 1 });
adminPermissionSchema.index({ action: 1 });
adminPermissionSchema.index({ isActive: 1 });
adminPermissionSchema.index({ createdAt: -1 });

// Virtual for full permission
adminPermissionSchema.virtual('fullPermission').get(function () {
  return `${this.resource}:${this.action}`;
});

// Virtual for display name
adminPermissionSchema.virtual('displayName').get(function () {
  return `${this.action.charAt(0).toUpperCase() + this.action.slice(1)} ${this.resource}`;
});

// Pre-save middleware to generate slug if not provided
adminPermissionSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = `${this.resource}-${this.action}`;
  }
  next();
});

// Static method to find by resource
adminPermissionSchema.statics.findByResource = function (resource: string) {
  return this.find({ resource, isActive: true }).sort({ action: 1 });
};

// Static method to find by action
adminPermissionSchema.statics.findByAction = function (action: string) {
  return this.find({ action, isActive: true }).sort({ resource: 1 });
};

// Static method to find active permissions
adminPermissionSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ resource: 1, action: 1 });
};

// Static method to find by slug
adminPermissionSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

// Static method to find by resource and action
adminPermissionSchema.statics.findByResourceAndAction = function (resource: string, action: string) {
  return this.findOne({ resource, action, isActive: true });
};

// Static method to create default permissions
adminPermissionSchema.statics.createDefaultPermissions = async function () {
  const defaultPermissions = [
    // User permissions
    { name: 'Create Users', resource: 'users', action: 'create' },
    { name: 'Read Users', resource: 'users', action: 'read' },
    { name: 'Update Users', resource: 'users', action: 'update' },
    { name: 'Delete Users', resource: 'users', action: 'delete' },
    
    // Course permissions
    { name: 'Create Courses', resource: 'courses', action: 'create' },
    { name: 'Read Courses', resource: 'courses', action: 'read' },
    { name: 'Update Courses', resource: 'courses', action: 'update' },
    { name: 'Delete Courses', resource: 'courses', action: 'delete' },
    { name: 'Approve Courses', resource: 'courses', action: 'approve' },
    { name: 'Reject Courses', resource: 'courses', action: 'reject' },
    
    // Content permissions
    { name: 'Manage Sections', resource: 'sections', action: 'create' },
    { name: 'Manage Lessons', resource: 'lessons', action: 'create' },
    { name: 'Manage Assignments', resource: 'assignments', action: 'create' },
    
    // Support permissions
    { name: 'Manage Support Tickets', resource: 'support', action: 'create' },
    { name: 'Assign Tickets', resource: 'support', action: 'assign' },
    
    // System permissions
    { name: 'System Settings', resource: 'system', action: 'read' },
    { name: 'Manage Permissions', resource: 'permissions', action: 'create' },
    { name: 'Manage Roles', resource: 'roles', action: 'create' },
    
    // Analytics permissions
    { name: 'View Analytics', resource: 'analytics', action: 'read' },
    { name: 'Generate Reports', resource: 'reports', action: 'create' },
  ];

  for (const permission of defaultPermissions) {
    const existing = await this.findOne({ resource: permission.resource, action: permission.action });
    if (!existing) {
      await this.create(permission);
    }
  }
};

// Export the model
export default mongoose.model<IAdminPermission>('AdminPermission', adminPermissionSchema);
