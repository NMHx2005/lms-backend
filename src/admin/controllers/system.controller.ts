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
   * Process refund request
   */
  static async processRefund(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be approved or rejected'
        });
      }

      const refund = await SystemService.processRefund(
        id, 
        status, 
        adminNotes, 
        (req.user as any)?.id
      );

      res.json({
        success: true,
        message: `Refund request ${status} successfully`,
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
