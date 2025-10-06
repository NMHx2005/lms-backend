import { Request, Response } from 'express';
import { SystemService } from '../services/system.service';

export class SystemController {
  /**
   * Get system overview
   */
  static async getSystemOverview(req: Request, res: Response) {
    try {
      const overview = await SystemService.getSystemOverview();

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get pending refunds
   */
  static async getRefunds(req: Request, res: Response) {
    try {
      const { page, limit, status } = req.query;

      const filters = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string | undefined
      };

      const result = await SystemService.getRefunds(filters);

      res.json({
        success: true,
        data: result.refunds,
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
   * Get refund statistics
   */
  static async getRefundStats(req: Request, res: Response) {
    try {
      const stats = await SystemService.getRefundStats();

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
   * Process refund request
   */
  static async processRefund(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, notes, refundMethod } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be approve or reject'
        });
      }

      const refund = await SystemService.processRefund(
        id,
        action,
        notes,
        refundMethod,
        (req.user as any)?.id
      );

      res.json({
        success: true,
        message: `Refund request ${action}d successfully`,
        data: refund
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Refund request not found') {
        return res.status(404).json({
          success: false,
          error: 'Refund request not found'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Bulk process refunds
   */
  static async bulkProcessRefunds(req: Request, res: Response) {
    try {
      const { refundIds, action, notes } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be approve or reject'
        });
      }

      const result = await SystemService.bulkProcessRefunds(refundIds, action, notes, (req.user as any)?.id);

      res.json({
        success: true,
        message: `Bulk ${action} completed successfully`,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get system logs
   */
  static async getSystemLogs(req: Request, res: Response) {
    try {
      const { page, limit, type, severity } = req.query;

      const filters = {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        type: type as string | undefined,
        severity: severity as string | undefined
      };

      const result = await SystemService.getSystemLogs(filters);

      res.json({
        success: true,
        data: result.logs,
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
   * Get system settings
   */
  static async getSystemSettings(req: Request, res: Response) {
    try {
      const settings = await SystemService.getSystemSettings();

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(req: Request, res: Response) {
    try {
      const { maintenanceMode, maxFileSize, emailNotifications } = req.body;

      const updates: any = {};
      if (maintenanceMode !== undefined) updates.maintenanceMode = maintenanceMode;
      if (maxFileSize !== undefined) updates.maxFileSize = maxFileSize;
      if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;

      const updatedSettings = await SystemService.updateSystemSettings(updates);

      res.json({
        success: true,
        message: 'System settings updated successfully',
        data: updatedSettings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get backup status
   */
  static async getBackupStatus(req: Request, res: Response) {
    try {
      const backupStatus = await SystemService.getBackupStatus();

      res.json({
        success: true,
        data: backupStatus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
