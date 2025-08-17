export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
} as const;

export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES];

export const USER_SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  LAST_ACTIVITY: 'lastActivityAt',
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  EMAIL: 'email'
} as const;

export type UserSortField = typeof USER_SORT_FIELDS[keyof typeof USER_SORT_FIELDS];

export const USER_SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export type UserSortOrder = typeof USER_SORT_ORDERS[keyof typeof USER_SORT_ORDERS];

export const DEFAULT_USER_LIMIT = 20;
export const MAX_USER_LIMIT = 100;

export const USER_PASSWORD_MIN_LENGTH = 8;
export const USER_PASSWORD_MAX_LENGTH = 128;
