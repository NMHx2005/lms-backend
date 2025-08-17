export const REFUND_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const SYSTEM_HEALTH_STATUSES = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

export const LOG_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export const BACKUP_STATUSES = {
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export const BACKUP_TYPES = {
  FULL: 'full',
  INCREMENTAL: 'incremental'
} as const;

export const DEFAULT_SYSTEM_LIMIT = 10;
export const MAX_SYSTEM_LIMIT = 100;

export const SYSTEM_FILE_SIZE_LIMITS = {
  MIN: 1024, // 1KB
  MAX: 104857600 // 100MB
} as const;

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
] as const;

export type RefundStatus = typeof REFUND_STATUSES[keyof typeof REFUND_STATUSES];
export type SystemHealthStatus = typeof SYSTEM_HEALTH_STATUSES[keyof typeof SYSTEM_HEALTH_STATUSES];
export type LogSeverity = typeof LOG_SEVERITIES[keyof typeof LOG_SEVERITIES];
export type BackupStatus = typeof BACKUP_STATUSES[keyof typeof BACKUP_STATUSES];
export type BackupType = typeof BACKUP_TYPES[keyof typeof BACKUP_TYPES];
