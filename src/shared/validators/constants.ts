// Validation constants for consistent rules across the application
export const VALIDATION_CONSTANTS = {
  // String lengths
  STRING_LENGTHS: {
    MIN_NAME: 2,
    MAX_NAME: 100,
    MIN_DESCRIPTION: 10,
    MAX_DESCRIPTION: 1000,
    MIN_BIO: 10,
    MAX_BIO: 500,
    MIN_ADDRESS: 5,
    MAX_ADDRESS: 200,
    MIN_PHONE: 10,
    MAX_PHONE: 15,
    MIN_PASSWORD: 8,
    MAX_PASSWORD: 128,
  },

  // Numeric ranges
  NUMERIC_RANGES: {
    PRICE: { MIN: 0, MAX: 999999 },
    DURATION: { MIN: 1, MAX: 10080 }, // 1 minute to 1 week
    RATING: { MIN: 1, MAX: 5 },
    PERCENTAGE: { MIN: 0, MAX: 100 },
    AGE: { MIN: 13, MAX: 120 },
  },

  // File upload limits
  FILE_LIMITS: {
    IMAGE: {
      MAX_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      MAX_DIMENSIONS: { WIDTH: 2048, HEIGHT: 2048 },
    },
    DOCUMENT: {
      MAX_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },
    VIDEO: {
      MAX_SIZE: 100 * 1024 * 1024, // 100MB
      ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
    },
  },

  // Pagination limits
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
  },

  // Date ranges
  DATE_RANGES: {
    MIN_DATE: new Date('1900-01-01'),
    MAX_DATE: new Date('2100-12-31'),
  },

  // Regex patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    // Accept either local numbers starting with 0 (10-15 digits) or international format starting with non-zero digit, optional +
    PHONE: /^(0\d{9,14}|\+?[1-9]\d{9,14})$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    MONGO_ID: /^[0-9a-fA-F]{24}$/,
  },

  // Role permissions
  ROLES: {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
    ALL: ['admin', 'teacher', 'student'],
  },

  // Course statuses
  COURSE_STATUSES: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
    NEEDS_REVISION: 'needs_revision',
    DELISTED: 'delisted',
    ALL: ['draft', 'submitted', 'approved', 'published', 'rejected', 'needs_revision', 'delisted'],
  },

  // Enrollment statuses
  ENROLLMENT_STATUSES: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    SUSPENDED: 'suspended',
    ALL: ['active', 'completed', 'cancelled', 'suspended'],
  },
};
