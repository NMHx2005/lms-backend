import { User } from '../../shared/models';
import { 
  SupportTicket, 
  SupportTicketDetail,
  SupportStaff,
  TicketStatistics,
  SupportQueryFilters,
  TicketSearchFilters
} from '../interfaces/support.interface';
import { TICKET_NUMBER_PREFIX, TICKET_NUMBER_LENGTH } from '../constants/support.constants';

export class SupportService {
  /**
   * Get all support tickets with pagination and filters
   */
  static async getTickets(filters: SupportQueryFilters): Promise<{
    tickets: SupportTicket[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, status, priority, category, assignedTo } = filters;
      
      // Mock data - in real app this would query a support tickets collection
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          ticketNumber: 'TKT-001',
          subject: 'Course access issue',
          description: 'Cannot access course content',
          priority: 'high',
          status: 'open',
          category: 'technical',
          userId: 'user123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedTo: undefined,
          lastResponseAt: undefined,
          responseTime: undefined
        }
      ];

      // Apply filters (mock implementation)
      let filteredTickets = mockTickets;
      
      if (status) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
      }
      
      if (priority) {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === priority);
      }
      
      if (category) {
        filteredTickets = filteredTickets.filter(ticket => ticket.category === category);
      }
      
      if (assignedTo) {
        filteredTickets = filteredTickets.filter(ticket => ticket.assignedTo === assignedTo);
      }

      const total = filteredTickets.length;
      const skip = (Number(page) - 1) * Number(limit);
      const paginatedTickets = filteredTickets.slice(skip, skip + Number(limit));

      return {
        tickets: paginatedTickets,
        total,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      throw new Error('Failed to get tickets');
    }
  }

  /**
   * Get ticket by ID with full details
   */
  static async getTicketById(ticketId: string): Promise<SupportTicketDetail> {
    try {
      // Mock data - in real app this would query a support tickets collection
      const mockTicket: SupportTicketDetail = {
        id: ticketId,
        ticketNumber: 'TKT-001',
        subject: 'Course access issue',
        description: 'Cannot access course content',
        priority: 'high',
        status: 'open',
        category: 'technical',
        userId: 'user123',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: undefined,
        lastResponseAt: undefined,
        responseTime: undefined,
        messages: [
          {
            id: '1',
            userId: 'user123',
            userName: 'John Doe',
            message: 'I cannot access the course content',
            isInternal: false,
            createdAt: new Date()
          }
        ],
        attachments: [],
        tags: ['course-access', 'technical'],
        internalNotes: []
      };

      return mockTicket;
    } catch (error) {
      throw new Error('Failed to get ticket');
    }
  }

  /**
   * Assign ticket to support staff
   */
  static async assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket> {
    try {
      // Mock implementation - in real app this would update a support tickets collection
      const ticket = await SupportService.getTicketById(ticketId);
      
      // Update assignment
      const updatedTicket: SupportTicket = {
        ...ticket,
        assignedTo,
        updatedAt: new Date()
      };

      return updatedTicket;
    } catch (error) {
      throw new Error('Failed to assign ticket');
    }
  }

  /**
   * Update ticket status
   */
  static async updateTicketStatus(
    ticketId: string, 
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed',
    internalNote?: string
  ): Promise<SupportTicket> {
    try {
      // Mock implementation - in real app this would update a support tickets collection
      const ticket = await SupportService.getTicketById(ticketId);
      
      // Update status
      const updatedTicket: SupportTicket = {
        ...ticket,
        status,
        updatedAt: new Date()
      };

      return updatedTicket;
    } catch (error) {
      throw new Error('Failed to update ticket status');
    }
  }

  /**
   * Add internal note to ticket
   */
  static async addInternalNote(ticketId: string, note: string): Promise<SupportTicket> {
    try {
      // Mock implementation - in real app this would add to a support tickets collection
      const ticket = await SupportService.getTicketById(ticketId);
      
      // Add internal note
      const updatedTicket: SupportTicket = {
        ...ticket,
        updatedAt: new Date()
      };

      return updatedTicket;
    } catch (error) {
      throw new Error('Failed to add internal note');
    }
  }

  /**
   * Get support staff
   */
  static async getSupportStaff(): Promise<SupportStaff[]> {
    try {
      // Query users with admin role
      const supportStaff = await User.find({ roles: 'admin' })
        .select('name email avatar')
        .limit(20)
        .lean();

      // Map to interface
      return supportStaff.map(staff => ({
        _id: staff._id.toString(),
        name: staff.name,
        email: staff.email,
        avatar: staff.avatar,
        role: 'admin',
        isAvailable: true, // Mock data
        currentTickets: Math.floor(Math.random() * 5), // Mock data
        maxTickets: 10
      }));
    } catch (error) {
      throw new Error('Failed to get support staff');
    }
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStatistics(): Promise<TicketStatistics> {
    try {
      // Mock data - in real app this would query a support tickets collection
      const stats: TicketStatistics = {
        totalTickets: 150,
        openTickets: 25,
        resolvedTickets: 120,
        averageResponseTime: '2.5 hours',
        satisfactionRate: 4.2,
        ticketsByPriority: {
          low: 30,
          medium: 60,
          high: 40,
          urgent: 20
        },
        ticketsByCategory: {
          technical: 50,
          billing: 30,
          course: 40,
          general: 30,
          other: 0
        },
        ticketsByStatus: {
          open: 25,
          in_progress: 15,
          waiting: 10,
          resolved: 120,
          closed: 100
        }
      };

      return stats;
    } catch (error) {
      throw new Error('Failed to get ticket statistics');
    }
  }

  /**
   * Search tickets
   */
  static async searchTickets(filters: TicketSearchFilters): Promise<{
    tickets: SupportTicket[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, search, userId, dateFrom, dateTo } = filters;
      
      // Mock implementation - in real app this would search a support tickets collection
      let mockTickets: SupportTicket[] = [
        {
          id: '1',
          ticketNumber: 'TKT-001',
          subject: 'Course access issue',
          description: 'Cannot access course content',
          priority: 'high',
          status: 'open',
          category: 'technical',
          userId: 'user123',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedTo: undefined,
          lastResponseAt: undefined,
          responseTime: undefined
        }
      ];

      // Apply search filters (mock implementation)
      if (search) {
        mockTickets = mockTickets.filter(ticket => 
          ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
          ticket.description.toLowerCase().includes(search.toLowerCase()) ||
          ticket.ticketNumber.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (userId) {
        mockTickets = mockTickets.filter(ticket => ticket.userId === userId);
      }

              if (dateFrom || dateTo) {
          mockTickets = mockTickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            if (dateFrom && ticketDate < new Date(dateFrom as Date)) return false;
            if (dateTo && ticketDate > new Date(dateTo as Date)) return false;
            return true;
          });
        }

      const total = mockTickets.length;
      const skip = (Number(page) - 1) * Number(limit);
      const paginatedTickets = mockTickets.slice(skip, skip + Number(limit));

      return {
        tickets: paginatedTickets,
        total,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };
    } catch (error) {
      throw new Error('Failed to search tickets');
    }
  }

  /**
   * Generate ticket number
   */
  static generateTicketNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const ticketNumber = `${TICKET_NUMBER_PREFIX}-${timestamp.slice(-3)}${random}`;
    return ticketNumber;
  }

  /**
   * Calculate response time in hours
   */
  static calculateResponseTime(createdAt: Date, lastResponseAt?: Date): number {
    if (!lastResponseAt) return 0;
    
    const timeDiff = lastResponseAt.getTime() - createdAt.getTime();
    return Math.round(timeDiff / (1000 * 60 * 60)); // Convert to hours
  }
}
