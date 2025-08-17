import { Request, Response } from 'express';
import { SupportService } from '../services/support.service';

export class SupportController {
  /**
   * Get all support tickets
   */
  static async getTickets(req: Request, res: Response) {
    try {
      const { page, limit, status, priority, category, assignedTo } = req.query;
      
      const filters = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string | undefined,
        priority: priority as string | undefined,
        category: category as string | undefined,
        assignedTo: assignedTo as string | undefined
      };

      const result = await SupportService.getTickets(filters);

      res.json({
        success: true,
        data: result.tickets,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get ticket by ID
   */
  static async getTicketById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const ticket = await SupportService.getTicketById(id);

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Ticket not found') {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Assign ticket to support staff
   */
  static async assignTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      
      const ticket = await SupportService.assignTicket(id, assignedTo);
      
      res.json({
        success: true,
        message: 'Ticket assigned successfully',
        data: ticket
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Ticket not found') {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update ticket status
   */
  static async updateTicketStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, internalNote } = req.body;
      
      if (!['open', 'in_progress', 'waiting', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      const ticket = await SupportService.updateTicketStatus(id, status, internalNote);
      
      res.json({
        success: true,
        message: 'Ticket status updated successfully',
        data: ticket
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Ticket not found') {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Add internal note to ticket
   */
  static async addInternalNote(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { note } = req.body;
      
      const ticket = await SupportService.addInternalNote(id, note);
      
      res.json({
        success: true,
        message: 'Internal note added successfully',
        data: ticket
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Ticket not found') {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get support staff
   */
  static async getSupportStaff(req: Request, res: Response) {
    try {
      const supportStaff = await SupportService.getSupportStaff();

      res.json({
        success: true,
        data: supportStaff
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStatistics(req: Request, res: Response) {
    try {
      const stats = await SupportService.getTicketStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Search tickets
   */
  static async searchTickets(req: Request, res: Response) {
    try {
      const { page, limit, search, userId, dateFrom, dateTo } = req.query;
      
      const filters = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string | undefined,
        userId: userId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const result = await SupportService.searchTickets(filters);

      res.json({
        success: true,
        data: result.tickets,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
