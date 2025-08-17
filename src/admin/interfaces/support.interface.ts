export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'course' | 'general' | 'other';
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  assignedToName?: string;
  lastResponseAt?: Date;
  responseTime?: number; // in hours
}

export interface SupportTicketDetail extends SupportTicket {
  messages: TicketMessage[];
  attachments?: TicketAttachment[];
  tags?: string[];
  internalNotes?: string[];
}

export interface TicketMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface TicketListResponse {
  success: boolean;
  data: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AssignTicketRequest {
  assignedTo: string;
}

export interface UpdateTicketStatusRequest {
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  internalNote?: string;
}

export interface AddInternalNoteRequest {
  note: string;
}

export interface SupportStaff {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isAvailable: boolean;
  currentTickets: number;
  maxTickets: number;
}

export interface TicketStatistics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: string;
  satisfactionRate: number;
  ticketsByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  ticketsByCategory: {
    technical: number;
    billing: number;
    course: number;
    general: number;
    other: number;
  };
  ticketsByStatus: {
    open: number;
    in_progress: number;
    waiting: number;
    resolved: number;
    closed: number;
  };
}

export interface SupportQueryFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TicketSearchFilters extends SupportQueryFilters {
  search?: string;
  userId?: string;
}
