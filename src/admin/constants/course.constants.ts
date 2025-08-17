export const COURSE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
} as const;

export type CourseLevel = typeof COURSE_LEVELS[keyof typeof COURSE_LEVELS];

export const COURSE_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const;

export type CourseStatus = typeof COURSE_STATUSES[keyof typeof COURSE_STATUSES];

export const COURSE_SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  TITLE: 'title',
  PRICE: 'price',
  DURATION: 'duration',
  TOTAL_STUDENTS: 'totalStudents',
  AVERAGE_RATING: 'averageRating',
  PUBLISHED_AT: 'publishedAt'
} as const;

export type CourseSortField = typeof COURSE_SORT_FIELDS[keyof typeof COURSE_SORT_FIELDS];

export const COURSE_SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export type CourseSortOrder = typeof COURSE_SORT_ORDERS[keyof typeof COURSE_SORT_ORDERS];

export const DEFAULT_COURSE_LIMIT = 20;
export const MAX_COURSE_LIMIT = 100;

export const COURSE_PRICE_MIN = 0;
export const COURSE_PRICE_MAX = 9999;

export const COURSE_DURATION_MIN = 1; // 1 minute
export const COURSE_DURATION_MAX = 10080; // 1 week in minutes

export const COURSE_TITLE_MIN_LENGTH = 5;
export const COURSE_TITLE_MAX_LENGTH = 200;

export const COURSE_DESCRIPTION_MIN_LENGTH = 20;
export const COURSE_DESCRIPTION_MAX_LENGTH = 2000;
