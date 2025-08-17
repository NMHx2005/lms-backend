import { SupportTicket, TicketStatistics } from '../interfaces/support.interface';
import { PRIORITY_WEIGHTS, STATUS_ORDER, RESPONSE_TIME_THRESHOLDS } from '../constants/support.constants';

export class SupportUtils {
  /**
   * Sort tickets by priority (urgent first)
   */
  static sortByPriority(tickets: SupportTicket[]): SupportTicket[] {
    return tickets.sort((a, b) => {
      const priorityA = PRIORITY_WEIGHTS[a.priority] || 0;
      const priorityB = PRIORITY_WEIGHTS[b.priority] || 0;
      return priorityB - priorityA; // Higher priority first
    });
  }

  /**
   * Sort tickets by status (open first)
   */
  static sortByStatus(tickets: SupportTicket[]): SupportTicket[] {
    return tickets.sort((a, b) => {
      const statusA = STATUS_ORDER[a.status] || 999;
      const statusB = STATUS_ORDER[b.status] || 999;
      return statusA - statusB; // Lower status order first
    });
  }

  /**
   * Sort tickets by creation date (newest first)
   */
  static sortByDate(tickets: SupportTicket[]): SupportTicket[] {
    return tickets.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Sort tickets by response time (longest first)
   */
  static sortByResponseTime(tickets: SupportTicket[]): SupportTicket[] {
    return tickets.sort((a, b) => {
      const responseTimeA = a.responseTime || 0;
      const responseTimeB = b.responseTime || 0;
      return responseTimeB - responseTimeA; // Longest response time first
    });
  }

  /**
   * Filter tickets by overdue response time
   */
  static getOverdueTickets(tickets: SupportTicket[]): SupportTicket[] {
    return tickets.filter(ticket => {
      if (!ticket.responseTime) return false;
      
      const threshold = RESPONSE_TIME_THRESHOLDS[ticket.priority.toUpperCase() as keyof typeof RESPONSE_TIME_THRESHOLDS];
      return ticket.responseTime > threshold;
    });
  }

  /**
   * Calculate average response time from statistics
   */
  static calculateAverageResponseTime(stats: TicketStatistics): number {
    const totalTickets = stats.totalTickets;
    if (totalTickets === 0) return 0;
    
    // Parse the average response time string (e.g., "2.5 hours")
    const timeStr = stats.averageResponseTime;
    const match = timeStr.match(/(\d+(?:\.\d+)?)\s*(hours?|minutes?|days?)/i);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    // Convert to hours
    switch (unit) {
      case 'hour':
      case 'hours':
        return value;
      case 'minute':
      case 'minutes':
        return value / 60;
      case 'day':
      case 'days':
        return value * 24;
      default:
        return value;
    }
  }

  /**
   * Calculate response time percentage
   */
  static calculateResponseTimePercentage(tickets: SupportTicket[]): {
    onTime: number;
    overdue: number;
    total: number;
  } {
    const total = tickets.length;
    if (total === 0) return { onTime: 0, overdue: 0, total: 0 };
    
    let onTime = 0;
    let overdue = 0;
    
    tickets.forEach(ticket => {
      if (!ticket.responseTime) {
        onTime++; // No response time means it's still open
        return;
      }
      
      const threshold = RESPONSE_TIME_THRESHOLDS[ticket.priority.toUpperCase() as keyof typeof RESPONSE_TIME_THRESHOLDS];
      if (ticket.responseTime <= threshold) {
        onTime++;
      } else {
        overdue++;
      }
    });
    
    return { onTime, overdue, total };
  }

  /**
   * Generate priority badge color
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return '#dc3545'; // Red
      case 'high':
        return '#fd7e14'; // Orange
      case 'medium':
        return '#ffc107'; // Yellow
      case 'low':
        return '#28a745'; // Green
      default:
        return '#6c757d'; // Gray
    }
  }

  /**
   * Generate status badge color
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'open':
        return '#007bff'; // Blue
      case 'in_progress':
        return '#17a2b8'; // Cyan
      case 'waiting':
        return '#6f42c1'; // Purple
      case 'resolved':
        return '#28a745'; // Green
      case 'closed':
        return '#6c757d'; // Gray
      default:
        return '#6c757d'; // Gray
    }
  }

  /**
   * Format response time for display
   */
  static formatResponseTime(hours: number): string {
    if (hours === 0) return 'No response';
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    if (hours < 24) {
      return `${Math.round(hours)} hour${Math.round(hours) !== 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    
    return `${days} day${days !== 1 ? 's' : ''} ${Math.round(remainingHours)} hour${Math.round(remainingHours) !== 1 ? 's' : ''}`;
  }

  /**
   * Check if ticket needs immediate attention
   */
  static needsImmediateAttention(ticket: SupportTicket): boolean {
    if (ticket.priority === 'urgent') return true;
    
    if (ticket.priority === 'high' && ticket.status === 'open') {
      const hoursSinceCreation = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation > RESPONSE_TIME_THRESHOLDS.HIGH;
    }
    
    return false;
  }

  /**
   * Generate ticket summary for dashboard
   */
  static generateTicketSummary(tickets: SupportTicket[]): {
    urgent: number;
    high: number;
    open: number;
    overdue: number;
  } {
    const urgent = tickets.filter(t => t.priority === 'urgent').length;
    const high = tickets.filter(t => t.priority === 'high').length;
    const open = tickets.filter(t => t.status === 'open').length;
    const overdue = SupportUtils.getOverdueTickets(tickets).length;
    
    return { urgent, high, open, overdue };
  }
}
