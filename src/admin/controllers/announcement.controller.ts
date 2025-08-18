import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { announcementService, CreateAnnouncementData, AnnouncementFilter } from '../../shared/services/communication/announcement.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';

export class AdminAnnouncementController {
  
  // Create new announcement
  static createAnnouncement = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
    const announcementData: CreateAnnouncementData = {
      ...req.body,
      createdBy: {
        userId: req.user!.id,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
        role: req.user!.role
      }
    };

    const announcement = await announcementService.createAnnouncement(announcementData);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  });

  // Get all announcements with filtering
  static getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      type,
      priority,
      targetType,
      createdBy,
      tags,
      startDate,
      endDate,
      search
    } = req.query;

    const filter: AnnouncementFilter = {};

    if (status) {
      filter.status = typeof status === 'string' ? [status] : status as string[];
    }

    if (type) {
      filter.type = typeof type === 'string' ? [type] : type as string[];
    }

    if (priority) {
      filter.priority = typeof priority === 'string' ? [priority] : priority as string[];
    }

    if (targetType) {
      filter.targetType = typeof targetType === 'string' ? [targetType] : targetType as string[];
    }

    if (createdBy) {
      filter.createdBy = createdBy as string;
    }

    if (tags) {
      filter.tags = typeof tags === 'string' ? [tags] : tags as string[];
    }

    if (startDate && endDate) {
      filter.dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    if (search) {
      filter.searchTerm = search as string;
    }

    const result = await announcementService.getAnnouncements(
      filter,
      Number(page),
      Number(limit),
      sortBy as string,
      sortOrder as 'asc' | 'desc'
    );

    res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: result
    });
  });

  // Get announcement by ID
  static getAnnouncementById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await announcementService.getAnnouncementById(id);

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement retrieved successfully',
      data: announcement
    });
  });

  // Update announcement
  static updateAnnouncement = asyncHandler<AuthenticatedRequest>(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const updateData = {
      ...req.body,
      updatedBy: {
        userId: req.user!.id,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
        role: req.user!.role
      }
    };

    const announcement = await announcementService.updateAnnouncement(id, updateData);

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  });

  // Delete announcement
  static deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const deleted = await announcementService.deleteAnnouncement(id);

    if (!deleted) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  });

  // Publish announcement
  static publishAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await announcementService.publishAnnouncement(id);

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement published successfully',
      data: announcement
    });
  });

  // Cancel announcement
  static cancelAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await announcementService.cancelAnnouncement(id);

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement cancelled successfully',
      data: announcement
    });
  });

  // Get announcement analytics
  static getAnnouncementAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const analytics = await announcementService.getAnnouncementAnalytics(id);

    if (!analytics) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement analytics retrieved successfully',
      data: analytics
    });
  });

  // Bulk operations
  static bulkPublishAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    const { announcementIds } = req.body;

    if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
      throw new AppError('Announcement IDs array is required', 400);
    }

    const results = await Promise.allSettled(
      announcementIds.map(id => announcementService.publishAnnouncement(id))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.length - successful;

    res.status(200).json({
      success: true,
      message: `Bulk publish completed: ${successful} successful, ${failed} failed`,
      data: {
        successful,
        failed,
        results
      }
    });
  });

  static bulkDeleteAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    const { announcementIds } = req.body;

    if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
      throw new AppError('Announcement IDs array is required', 400);
    }

    const results = await Promise.allSettled(
      announcementIds.map(id => announcementService.deleteAnnouncement(id))
    );

    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - successful;

    res.status(200).json({
      success: true,
      message: `Bulk delete completed: ${successful} successful, ${failed} failed`,
      data: {
        successful,
        failed,
        results
      }
    });
  });

  // Get announcement statistics
  static getAnnouncementStats = asyncHandler(async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      type,
      targetType
    } = req.query;

    // This would typically use aggregation pipelines
    // For now, providing a basic implementation
    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (type) {
      filter.type = type;
    }

    if (targetType) {
      filter['target.type'] = targetType;
    }

    // Mock stats - in real implementation, use aggregation
    const stats = {
      totalAnnouncements: 0,
      publishedAnnouncements: 0,
      scheduledAnnouncements: 0,
      expiredAnnouncements: 0,
      totalViews: 0,
      totalClicks: 0,
      totalAcknowledgments: 0,
      byType: {},
      byPriority: {},
      byTargetType: {},
      recentActivity: []
    };

    res.status(200).json({
      success: true,
      message: 'Announcement statistics retrieved successfully',
      data: stats
    });
  });
}
