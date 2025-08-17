import mongoose, { Document, Schema } from 'mongoose';

// AdminRole interface
export interface IAdminRole extends Document {
  name: string;
  slug: string;
  description?: string;
  permissions: mongoose.Types.ObjectId[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AdminRole schema
const adminRoleSchema = new Schema<IAdminRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Role slug is required'],
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
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'AdminPermission',
      required: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
adminRoleSchema.index({ slug: 1 }, { unique: true });
adminRoleSchema.index({ isActive: 1 });
adminRoleSchema.index({ isSystem: 1 });
adminRoleSchema.index({ createdAt: -1 });

// Virtual for permissions
adminRoleSchema.virtual('permissionDetails', {
  ref: 'AdminPermission',
  localField: 'permissions',
  foreignField: '_id',
});

// Virtual for permission count
adminRoleSchema.virtual('permissionCount').get(function () {
  return this.permissions.length;
});

// Virtual for isSuperAdmin
adminRoleSchema.virtual('isSuperAdmin').get(function () {
  return this.slug === 'super-admin';
});

// Pre-save middleware to generate slug if not provided
adminRoleSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Pre-save middleware to validate permissions
adminRoleSchema.pre('save', async function (next) {
  if (this.permissions.length === 0) {
    return next(new Error('Role must have at least one permission'));
  }
  
  // Validate that all permissions exist
  const AdminPermission = mongoose.model('AdminPermission');
  const validPermissions = await AdminPermission.find({
    _id: { $in: this.permissions },
    isActive: true,
  });
  
  if (validPermissions.length !== this.permissions.length) {
    return next(new Error('Some permissions are invalid or inactive'));
  }
  
  next();
});

// Pre-save middleware to prevent system role deletion
adminRoleSchema.pre('save', function (next) {
  if (this.isSystem && this.isModified('isActive') && !this.isActive) {
    return next(new Error('System roles cannot be deactivated'));
  }
  next();
});

// Static method to find by slug
adminRoleSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

// Static method to find active roles
adminRoleSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find system roles
adminRoleSchema.statics.findSystem = function () {
  return this.find({ isSystem: true, isActive: true });
};

// Static method to find custom roles
adminRoleSchema.statics.findCustom = function () {
  return this.find({ isSystem: false, isActive: true });
};

// Static method to create default roles
adminRoleSchema.statics.createDefaultRoles = async function () {
  const AdminPermission = mongoose.model('AdminPermission');
  
  // Get all permissions
  const allPermissions = await AdminPermission.find({ isActive: true });
  
  const defaultRoles = [
    {
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Full system access with all permissions',
      permissions: allPermissions.map(p => p._id),
      isSystem: true,
    },
    {
      name: 'Course Manager',
      slug: 'course-manager',
      description: 'Manage courses, content, and assignments',
      permissions: allPermissions
        .filter(p => ['courses', 'sections', 'lessons', 'assignments'].includes(p.resource))
        .map(p => p._id),
      isSystem: true,
    },
    {
      name: 'User Manager',
      slug: 'user-manager',
      description: 'Manage users and enrollments',
      permissions: allPermissions
        .filter(p => ['users', 'enrollments'].includes(p.resource))
        .map(p => p._id),
      isSystem: true,
    },
    {
      name: 'Support Manager',
      slug: 'support-manager',
      description: 'Manage support tickets and customer service',
      permissions: allPermissions
        .filter(p => ['support'].includes(p.resource))
        .map(p => p._id),
      isSystem: true,
    },
    {
      name: 'Analytics Viewer',
      slug: 'analytics-viewer',
      description: 'View analytics and reports',
      permissions: allPermissions
        .filter(p => ['analytics', 'reports'].includes(p.resource) && p.action === 'read')
        .map(p => p._id),
      isSystem: true,
    },
  ];

  for (const role of defaultRoles) {
    const existing = await this.findOne({ slug: role.slug });
    if (!existing) {
      await this.create(role);
    }
  }
};

// Instance method to add permission
adminRoleSchema.methods.addPermission = async function (
  permissionId: mongoose.Types.ObjectId
) {
  if (this.permissions.includes(permissionId)) {
    throw new Error('Permission already exists in role');
  }
  
  this.permissions.push(permissionId);
  await this.save();
};

// Instance method to remove permission
adminRoleSchema.methods.removePermission = async function (
  permissionId: mongoose.Types.ObjectId
) {
  const index = this.permissions.indexOf(permissionId);
  if (index === -1) {
    throw new Error('Permission not found in role');
  }
  
  this.permissions.splice(index, 1);
  await this.save();
};

// Instance method to has permission
adminRoleSchema.methods.hasPermission = function (
  resource: string,
  action: string
): boolean {
  // Super admin has all permissions
  if (this.isSuperAdmin) return true;
  
  // Check if role has the specific permission
  return this.permissions.some((permission: any) => {
    return permission.resource === resource && permission.action === action;
  });
};

// Instance method to has any permission
adminRoleSchema.methods.hasAnyPermission = function (
  resource: string
): boolean {
  // Super admin has all permissions
  if (this.isSuperAdmin) return true;
  
  // Check if role has any permission for the resource
  return this.permissions.some((permission: any) => {
    return permission.resource === resource;
  });
};

// Export the model
export default mongoose.model<IAdminRole>('AdminRole', adminRoleSchema);
