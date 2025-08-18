import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { announcementService } from '../../shared/services/communication/announcement.service';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import Enrollment from '../../shared/models/core/Enrollment';

export class ClientAnnouncementController {
  
  // Get announcements for current user
  static getMyAnnouncements = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false
    } = req.query;

    const userId = req.user!.id.toString();
    const userRole = req.user!.role;

    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ 
      studentId: req.user!.id,
      status: 'active' 
    }).select('courseId');
    const enrolledCourses = enrollments.map(enrollment => enrollment.courseId.toString());

    const result = await announcementService.getAnnouncementsForUser(
      userId,
      userRole,
      enrolledCourses,
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: result
    });
  });

  // Get announcement by ID (for user viewing)
  static getAnnouncementById = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const announcement = await announcementService.getAnnouncementById(id);

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    // Check if user has access to this announcement
    const userId = req.user!.id.toString();
    const userRole = req.user!.role;

    const enrollments = await Enrollment.find({ 
      studentId: req.user!.id,
      status: 'active' 
    }).select('courseId');
    const enrolledCourses = enrollments.map(enrollment => enrollment.courseId.toString());

    const hasAccess = this.checkAnnouncementAccess(announcement, userId, userRole, enrolledCourses);

    if (!hasAccess) {
      throw new AppError('You do not have access to this announcement', 403);
    }

    // Track view
    await announcementService.trackAnnouncementView(id);

    res.status(200).json({
      success: true,
      message: 'Announcement retrieved successfully',
      data: announcement
    });
  });

  // Acknowledge announcement
  static acknowledgeAnnouncement = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    const userId = req.user!.id.toString();
    const acknowledged = await announcementService.acknowledgeAnnouncement(id, userId);

    if (!acknowledged) {
      throw new AppError('Unable to acknowledge announcement or acknowledgment not required', 400);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement acknowledged successfully'
    });
  });

  // Track announcement click
  static trackAnnouncementClick = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid announcement ID', 400);
    }

    await announcementService.trackAnnouncementClick(id);

    res.status(200).json({
      success: true,
      message: 'Click tracked successfully'
    });
  });

  // Get urgent announcements
  static getUrgentAnnouncements = asyncHandler<AuthenticatedRequest>(async (req, res) => {  
    const userId = req.user!.id.toString();
    const userRole = req.user!.role;

    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ 
      studentId: req.user!.id,
      status: 'active' 
    }).select('courseId');
    const enrolledCourses = enrollments.map(enrollment => enrollment.courseId.toString());

    const result = await announcementService.getAnnouncementsForUser(
      userId,
      userRole,
      enrolledCourses,
      1,
      10
    );

    // Filter only urgent announcements
    const urgentAnnouncements = result.announcements.filter(
      announcement => announcement.priority === 'urgent' || announcement.type === 'urgent'
    );

    res.status(200).json({
      success: true,
      message: 'Urgent announcements retrieved successfully',
      data: {
        announcements: urgentAnnouncements,
        total: urgentAnnouncements.length
      }
    });
  });

  // Get course-specific announcements
  static getCourseAnnouncements = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;
    const {
      page = 1,
      limit = 20
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError('Invalid course ID', 400);
    }

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      studentId: req.user!.id,
      courseId: new mongoose.Types.ObjectId(courseId),
      status: 'active'
    });

    if (!enrollment) {
      throw new AppError('You are not enrolled in this course', 403);
    }

    const userId = req.user!.id.toString();
    const userRole = req.user!.role;

    const result = await announcementService.getAnnouncementsForUser(
      userId,
      userRole,
      [courseId],
      Number(page),
      Number(limit)
    );

    // Filter only course-specific announcements
    const courseAnnouncements = result.announcements.filter(
      announcement => 
        announcement.target.type === 'course' && 
        announcement.target.value === courseId
    );

    res.status(200).json({
      success: true,
      message: 'Course announcements retrieved successfully',
      data: {
        announcements: courseAnnouncements,
        total: courseAnnouncements.length
      }
    });
  });

  // Get announcement summary (for dashboard)
  static getAnnouncementSummary = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const userId = req.user!.id.toString();
    const userRole = req.user!.role;

    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ 
      studentId: req.user!.id,
      status: 'active' 
    }).select('courseId');
    const enrolledCourses = enrollments.map(enrollment => enrollment.courseId.toString());

    // Get recent announcements (last 10)
    const result = await announcementService.getAnnouncementsForUser(
      userId,
      userRole,
      enrolledCourses,
      1,
      10
    );

    const summary = {
      total: result.total,
      recent: result.announcements.slice(0, 5), // Last 5 for dashboard
      urgent: result.announcements.filter(a => a.priority === 'urgent' || a.type === 'urgent').length,
      unacknowledged: result.announcements.filter(a => 
        a.displayOptions.requireAcknowledgment && 
        !a.acknowledgedBy?.some(ack => ack.userId.toString() === userId)
      ).length
    };

    res.status(200).json({
      success: true,
      message: 'Announcement summary retrieved successfully',
      data: summary
    });
  });

  // Search announcements
  static searchAnnouncements = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const {
      query,
      page = 1,
      limit = 20
    } = req.query;

    if (!query || typeof query !== 'string') {
      throw new AppError('Search query is required', 400);
    }

    const userId = req.user!.id.toString();
    const userRole = req.user!.role;

    // Get user's enrolled courses
    const enrollments = await Enrollment.find({ 
      studentId: req.user!.id,
      status: 'active' 
    }).select('courseId');
    const enrolledCourses = enrollments.map(enrollment => enrollment.courseId.toString());

    // Get all user announcements first, then filter by search
    const result = await announcementService.getAnnouncementsForUser(
      userId,
      userRole,
      enrolledCourses,
      1,
      100 // Get more for searching
    );

    // Simple search implementation
    const searchResults = result.announcements.filter(announcement =>
      announcement.title.toLowerCase().includes(query.toLowerCase()) ||
      announcement.content.toLowerCase().includes(query.toLowerCase()) ||
      announcement.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    // Paginate search results
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedResults = searchResults.slice(startIndex, startIndex + Number(limit));

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        announcements: paginatedResults,
        total: searchResults.length,
        page: Number(page),
        pages: Math.ceil(searchResults.length / Number(limit))
      }
    });
  });

  // Helper method to check announcement access
  private static checkAnnouncementAccess(
    announcement: any,
    userId: string,
    userRole: string,
    enrolledCourses: string[]
  ): boolean {
    const { target } = announcement;

    switch (target.type) {
      case 'all':
        return true;
      
      case 'role':
        return target.value === userRole;
      
      case 'course':
        return enrolledCourses.includes(target.value);
      
      case 'user':
        const targetUsers = Array.isArray(target.value) ? target.value : [target.value];
        return targetUsers.includes(userId);
      
      default:
        return false;
    }
  }
}
