import { SystemHealth, BackupStatus } from '../interfaces/system.interface';

export class SystemUtils {
  /**
   * Format file size in bytes to human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if system is healthy overall
   */
  static isSystemHealthy(health: SystemHealth): boolean {
    return Object.values(health).every(status => status === 'healthy');
  }

  /**
   * Get system health score (0-100)
   */
  static getHealthScore(health: SystemHealth): number {
    const totalServices = Object.keys(health).length;
    const healthyServices = Object.values(health).filter(status => status === 'healthy').length;
    
    return Math.round((healthyServices / totalServices) * 100);
  }

  /**
   * Get health status priority for sorting
   */
  static getHealthPriority(status: string): number {
    switch (status) {
      case 'error': return 3;
      case 'warning': return 2;
      case 'healthy': return 1;
      default: return 0;
    }
  }

  /**
   * Check if backup is overdue
   */
  static isBackupOverdue(backupStatus: BackupStatus): boolean {
    const now = new Date();
    const lastBackup = new Date(backupStatus.lastBackup);
    const daysSinceLastBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 3600 * 24);
    
    // Consider backup overdue if more than 7 days
    return daysSinceLastBackup > 7;
  }

  /**
   * Calculate time until next backup
   */
  static getTimeUntilNextBackup(backupStatus: BackupStatus): string {
    const now = new Date();
    const nextBackup = new Date(backupStatus.nextBackup);
    const timeDiff = nextBackup.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Overdue';
    
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Validate file type against allowed types
   */
  static isValidFileType(fileType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(fileType);
  }

  /**
   * Validate file size against limits
   */
  static isValidFileSize(fileSize: number, maxSize: number): boolean {
    return fileSize > 0 && fileSize <= maxSize;
  }

  /**
   * Generate system status summary
   */
  static generateStatusSummary(health: SystemHealth): string {
    const score = SystemUtils.getHealthScore(health);
    
    if (score === 100) return 'All systems operational';
    if (score >= 75) return 'Most systems operational';
    if (score >= 50) return 'Some systems experiencing issues';
    return 'Multiple systems experiencing issues';
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Calculate uptime percentage
   */
  static calculateUptime(healthHistory: SystemHealth[]): number {
    if (healthHistory.length === 0) return 100;
    
    const healthyChecks = healthHistory.filter(health => 
      SystemUtils.isSystemHealthy(health)
    ).length;
    
    return Math.round((healthyChecks / healthHistory.length) * 100);
  }
}
