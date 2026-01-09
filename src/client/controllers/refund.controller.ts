import { Request, Response } from 'express';
import { ClientRefundService } from '../services/refund.service';

export class ClientRefundController {
  /**
   * Get eligible courses for refund
   */
  static async getEligibleCourses(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const courses = await ClientRefundService.getEligibleCourses(userId);

      res.json({
        success: true,
        data: courses
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch eligible courses'
      });
    }
  }

  /**
   * Create refund request
   */
  static async createRefundRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const refund = await ClientRefundService.createRefundRequest(userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Refund request created successfully',
        data: refund
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create refund request'
      });
    }
  }

  /**
   * Get user's refund requests
   */
  static async getRefundRequests(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { status, page, limit } = req.query;
      const result = await ClientRefundService.getRefundRequests(userId, {
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      res.json({
        success: true,
        data: result.refunds,
        pagination: result.pagination
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch refund requests'
      });
    }
  }

  /**
   * Get refund request details
   */
  static async getRefundDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { id } = req.params;
      const refund = await ClientRefundService.getRefundDetails(id, userId);

      res.json({
        success: true,
        data: refund
      });
    } catch (error: any) {

      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch refund details'
      });
    }
  }

  /**
   * Cancel refund request
   */
  static async cancelRefundRequest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { id } = req.params;
      const refund = await ClientRefundService.cancelRefundRequest(id, userId);

      res.json({
        success: true,
        message: 'Refund request cancelled successfully',
        data: refund
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel refund request'
      });
    }
  }

  /**
   * Get teacher's refund requests (for their courses)
   */
  static async getTeacherRefundRequests(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { status, page, limit } = req.query;
      const result = await ClientRefundService.getTeacherRefundRequests(userId, {
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      res.json({
        success: true,
        data: result.refunds,
        pagination: result.pagination
      });
    } catch (error: any) {

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch refund requests'
      });
    }
  }

  /**
   * Approve refund (teacher only)
   */
  static async approveRefund(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { id } = req.params;
      const refund = await ClientRefundService.approveRefund(id, userId, req.body);

      res.json({
        success: true,
        message: 'Refund approved successfully. Student has been removed from the course.',
        data: refund
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to approve refund'
      });
    }
  }

  /**
   * Reject refund (teacher only)
   */
  static async rejectRefund(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const { id } = req.params;
      const refund = await ClientRefundService.rejectRefund(id, userId, req.body);

      res.json({
        success: true,
        message: 'Refund rejected',
        data: refund
      });
    } catch (error: any) {

      res.status(400).json({
        success: false,
        error: error.message || 'Failed to reject refund'
      });
    }
  }
}

