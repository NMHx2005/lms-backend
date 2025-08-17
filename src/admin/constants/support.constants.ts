export const TICKET_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const TICKET_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING: 'waiting',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const;

export const TICKET_CATEGORIES = {
  TECHNICAL: 'technical',
  BILLING: 'billing',
  COURSE: 'course',
  GENERAL: 'general',
  OTHER: 'other'
} as const;

export const PRIORITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4
} as const;

export const STATUS_ORDER = {
  open: 1,
  in_progress: 2,
  waiting: 3,
  resolved: 4,
  closed: 5
} as const;

export const DEFAULT_SUPPORT_LIMIT = 10;
export const MAX_SUPPORT_LIMIT = 100;

export const RESPONSE_TIME_THRESHOLDS = {
  URGENT: 2, // 2 hours
  HIGH: 4,   // 4 hours
  MEDIUM: 8, // 8 hours
  LOW: 24    // 24 hours
} as const;

export const MAX_TICKETS_PER_STAFF = 10;
export const MAX_INTERNAL_NOTES = 50;
export const MAX_ATTACHMENTS_PER_TICKET = 10;

export const TICKET_NUMBER_PREFIX = 'TKT';
export const TICKET_NUMBER_LENGTH = 6;

export const AUTO_CLOSE_DAYS = 30; // Auto-close resolved tickets after 30 days

export type TicketPriority = typeof TICKET_PRIORITIES[keyof typeof TICKET_PRIORITIES];
export type TicketStatus = typeof TICKET_STATUSES[keyof typeof TICKET_STATUSES];
export type TicketCategory = typeof TICKET_CATEGORIES[keyof typeof TICKET_CATEGORIES];
