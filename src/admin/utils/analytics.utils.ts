import { ANALYTICS_PERIODS, AnalyticsPeriod } from '../constants/analytics.constants';

export class AnalyticsUtils {
  // Calculate date range based on period
  static getDateRange(period: AnalyticsPeriod): { startDate: Date; endDate: Date } {
    const days = Number(period);
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return { startDate, endDate };
  }

  // Format currency
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Calculate percentage
  static calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
  }

  // Calculate growth rate
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  // Format date for analytics
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Get month name from month number
  static getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }

  // Validate period parameter
  static isValidPeriod(period: string): period is AnalyticsPeriod {
    return Object.values(ANALYTICS_PERIODS).includes(period as AnalyticsPeriod);
  }

  // Get default period if invalid
  static getDefaultPeriod(period: string): AnalyticsPeriod {
    return this.isValidPeriod(period) ? period as AnalyticsPeriod : ANALYTICS_PERIODS.DAYS_30;
  }
}
