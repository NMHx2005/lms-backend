import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { announcementService, CreateAnnouncementData, AnnouncementFilter } from '../../shared/services/communication/announcement.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import Announcement from '../../shared/models/communication/Announcement';

export class AdminAnnouncementController {

  // Test endpoint to check data
  static testAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Direct MongoDB query to test
      const directQuery = await Announcement.find({});
      const directCount = await Announcement.countDocuments({});

      res.status(200).json({
        success: true,
        message: 'Direct MongoDB test',
        data: {
          directCount,
          directQuery: directQuery.length,
          announcements: directQuery
        }
      });
    } catch (error: any) {
      console.error('Test error:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Unknown error'
      });
    }
  });

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
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      // Use direct collection query to bypass schema validation issues
      const db = Announcement.db;
      const directCollection = db.collection('announcements');

      // Get total count and data
      const [announcements, total] = await Promise.all([
        directCollection.find({})
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        directCollection.countDocuments({})
      ]);

      res.status(200).json({
        success: true,
        message: 'Announcements retrieved successfully',
        data: {
          announcements,
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in getAnnouncements:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Get announcement by ID
  static getAnnouncementById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    // Use direct collection query to bypass schema validation issues
    const db = Announcement.db;
    const directCollection = db.collection('announcements');

    const announcement = await directCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });

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

    // Use direct collection query
    const db = Announcement.db;
    const directCollection = db.collection('announcements');

    const result = await directCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: result
    });
  });

  // Delete announcement
  static deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    // Use direct collection query
    const db = Announcement.db;
    const directCollection = db.collection('announcements');

    const result = await directCollection.deleteOne({ _id: new mongoose.Types.ObjectId(id) });

    if (result.deletedCount === 0) {
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

    // Use direct collection query to bypass schema validation issues
    const db = Announcement.db;
    const directCollection = db.collection('announcements');

    const result = await directCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'published',
          publishedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement published successfully',
      data: result
    });
  });

  // Cancel announcement
  static cancelAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    // Use direct collection query
    const db = Announcement.db;
    const directCollection = db.collection('announcements');

    const result = await directCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new AppError('Announcement not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement cancelled successfully',
      data: result
    });
  });

  // Get announcement analytics
  static getAnnouncementAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    // Use direct collection query
    const db = Announcement.db;
    const directCollection = db.collection('announcements');

    const announcement = await directCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    // Return analytics from the announcement document
    const analytics = {
      readCount: announcement.analytics?.totalViews || 0,
      clickCount: announcement.analytics?.totalClicks || 0,
      acknowledgmentCount: announcement.analytics?.totalAcknowledgments || 0,
      engagementRate: 0,
      conversionRate: 0,
      demographics: {},
      deviceStats: {},
      timeStats: {}
    };

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

    // Use direct collection query for real stats
    const db = Announcement.db;
    const directCollection = db.collection('announcements');

    const [totalAnnouncements, publishedAnnouncements, scheduledAnnouncements, draftAnnouncements, expiredAnnouncements, cancelledAnnouncements] = await Promise.all([
      directCollection.countDocuments({}),
      directCollection.countDocuments({ status: 'published' }),
      directCollection.countDocuments({ status: 'scheduled' }),
      directCollection.countDocuments({ status: 'draft' }),
      directCollection.countDocuments({ status: 'expired' }),
      directCollection.countDocuments({ status: 'cancelled' })
    ]);

    const stats = {
      totalAnnouncements,
      publishedAnnouncements,
      scheduledAnnouncements,
      draftAnnouncements,
      expiredAnnouncements,
      cancelledAnnouncements,
      totalReads: 0,
      totalClicks: 0,
      averageReadRate: 0,
      averageClickRate: 0,
      announcementsByType: [],
      announcementsByPriority: [],
      announcementsByAudience: []
    };

    res.status(200).json({
      success: true,
      message: 'Announcement statistics retrieved successfully',
      data: stats
    });
  });
}
