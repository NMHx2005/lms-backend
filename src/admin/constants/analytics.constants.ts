export const ANALYTICS_PERIODS = {
  DAYS_7: '7',
  DAYS_30: '30',
  DAYS_90: '90',
  DAYS_365: '365'
} as const;

export type AnalyticsPeriod = typeof ANALYTICS_PERIODS[keyof typeof ANALYTICS_PERIODS];

export const ANALYTICS_DEFAULT_PERIOD: AnalyticsPeriod = ANALYTICS_PERIODS.DAYS_30;

export const REVENUE_STATUSES = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;
