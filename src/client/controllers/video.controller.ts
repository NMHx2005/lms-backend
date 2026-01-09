import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/global';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  VideoUploadService,
  VideoProgressService,
  VideoAnalyticsService,
  VideoNoteService,
  SubtitleService,
} from '../../shared/services/video';
import { multerInstances } from '../../shared/middleware/multer';

export class VideoController {
  // ==================== VIDEO UPLOAD ====================

  /**
   * Upload video file for a lesson
   * POST /api/teacher/lessons/:lessonId/video/upload
   */
  static uploadVideo = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided',
      });
    }

    const result = await VideoUploadService.uploadVideo(file, {
      lessonId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: result,
    });
  });

  /**
   * Get video file info
   * GET /api/lessons/:lessonId/video
   */
  static getVideoFile = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const videoFile = await VideoUploadService.getVideoFileByLessonId(lessonId);

    if (!videoFile) {
      return res.status(404).json({
        success: false,
        error: 'Video file not found',
      });
    }

    res.json({
      success: true,
      data: videoFile,
    });
  });

  /**
   * Get video processing status
   * GET /api/teacher/lessons/:lessonId/video/status
   */
  static getVideoStatus = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const status = await VideoUploadService.getProcessingStatus(lessonId);

    res.json({
      success: true,
      data: status,
    });
  });

  /**
   * Delete video file
   * DELETE /api/teacher/lessons/:lessonId/video
   */
  static deleteVideo = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user!.id;

    await VideoUploadService.deleteVideo(lessonId, userId);

    res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  });

  // ==================== VIDEO PROGRESS ====================

  /**
   * Save video progress
   * POST /api/lessons/:lessonId/progress
   */
  static saveProgress = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;
    const { currentTime, progress, watchTime } = req.body;

    const result = await VideoProgressService.saveProgress(lessonId, studentId, {
      currentTime,
      progress,
      watchTime,
    });

    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: result,
    });
  });

  /**
   * Get video progress
   * GET /api/lessons/:lessonId/progress
   */
  static getProgress = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;

    const progress = await VideoProgressService.getProgress(lessonId, studentId);

    if (!progress) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: progress,
    });
  });

  /**
   * Get all progress for a course
   * GET /api/courses/:courseId/progress
   */
  static getCourseProgress = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user!.id;

    const progress = await VideoProgressService.getCourseProgress(courseId, studentId);

    res.json({
      success: true,
      data: progress,
    });
  });

  /**
   * Mark lesson as completed
   * POST /api/lessons/:lessonId/complete
   */
  static markCompleted = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;

    const progress = await VideoProgressService.markCompleted(lessonId, studentId);

    res.json({
      success: true,
      message: 'Lesson marked as completed',
      data: progress,
    });
  });

  // ==================== VIDEO ANALYTICS ====================

  /**
   * Record watch event
   * POST /api/lessons/:lessonId/analytics/event
   */
  static recordEvent = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;
    const { timestamp, action, timeSpent } = req.body;

    const analytics = await VideoAnalyticsService.recordEvent(lessonId, studentId, {
      timestamp,
      action,
      timeSpent,
    });

    res.json({
      success: true,
      message: 'Event recorded successfully',
      data: analytics,
    });
  });

  /**
   * Get student analytics for a lesson
   * GET /api/lessons/:lessonId/analytics
   */
  static getStudentAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;

    const analytics = await VideoAnalyticsService.getStudentAnalytics(lessonId, studentId);

    res.json({
      success: true,
      data: analytics,
    });
  });

  /**
   * Get lesson analytics (teacher view)
   * GET /api/teacher/lessons/:lessonId/analytics
   */
  static getLessonAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;

    const analytics = await VideoAnalyticsService.getLessonAnalytics(lessonId);

    res.json({
      success: true,
      data: analytics,
    });
  });

  /**
   * Get course video analytics (teacher view)
   * GET /api/teacher/courses/:courseId/video-analytics
   */
  static getCourseAnalytics = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { courseId } = req.params;

    const analytics = await VideoAnalyticsService.getCourseAnalytics(courseId);

    res.json({
      success: true,
      data: analytics,
    });
  });

  // ==================== VIDEO NOTES ====================

  /**
   * Create a video note
   * POST /api/lessons/:lessonId/notes
   */
  static createNote = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;
    const { timestamp, content, tags, isPublic } = req.body;

    const note = await VideoNoteService.createNote(lessonId, studentId, {
      timestamp,
      content,
      tags,
      isPublic,
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  });

  /**
   * Get all notes for a lesson
   * GET /api/lessons/:lessonId/notes
   */
  static getNotes = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;

    const notes = await VideoNoteService.getNotes(lessonId, studentId);

    res.json({
      success: true,
      data: notes,
    });
  });

  /**
   * Get public notes (classmates)
   * GET /api/lessons/:lessonId/notes/public
   */
  static getPublicNotes = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;

    const notes = await VideoNoteService.getPublicNotes(lessonId);

    res.json({
      success: true,
      data: notes,
    });
  });

  /**
   * Update a note
   * PUT /api/lessons/:lessonId/notes/:noteId
   */
  static updateNote = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { noteId } = req.params;
    const studentId = req.user!.id;
    const { content, tags, isPublic } = req.body;

    const note = await VideoNoteService.updateNote(noteId, studentId, {
      content,
      tags,
      isPublic,
    });

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: note,
    });
  });

  /**
   * Delete a note
   * DELETE /api/lessons/:lessonId/notes/:noteId
   */
  static deleteNote = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { noteId } = req.params;
    const studentId = req.user!.id;

    await VideoNoteService.deleteNote(noteId, studentId);

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  });

  /**
   * Search notes
   * GET /api/lessons/:lessonId/notes/search?q=query
   */
  static searchNotes = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    const notes = await VideoNoteService.searchNotes(lessonId, studentId, q);

    res.json({
      success: true,
      data: notes,
    });
  });

  /**
   * Export notes to text
   * GET /api/lessons/:lessonId/notes/export
   */
  static exportNotes = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user!.id;

    const text = await VideoNoteService.exportNotesToText(lessonId, studentId);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="notes-${lessonId}.txt"`);
    res.send(text);
  });

  // ==================== SUBTITLES ====================

  /**
   * Upload subtitle file
   * POST /api/teacher/lessons/:lessonId/subtitle
   */
  static uploadSubtitle = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user!.id;
    const { language } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No subtitle file provided',
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required',
      });
    }

    const subtitle = await SubtitleService.uploadSubtitle(lessonId, userId, {
      language,
      file,
    });

    res.status(201).json({
      success: true,
      message: 'Subtitle uploaded successfully',
      data: subtitle,
    });
  });

  /**
   * Get all subtitles for a lesson
   * GET /api/lessons/:lessonId/subtitles
   */
  static getSubtitles = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId } = req.params;

    const subtitles = await SubtitleService.getSubtitles(lessonId);

    res.json({
      success: true,
      data: subtitles,
    });
  });

  /**
   * Get subtitle by language
   * GET /api/lessons/:lessonId/subtitles/:language
   */
  static getSubtitleByLanguage = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { lessonId, language } = req.params;

    const subtitle = await SubtitleService.getSubtitleByLanguage(lessonId, language);

    if (!subtitle) {
      return res.status(404).json({
        success: false,
        error: 'Subtitle not found',
      });
    }

    res.json({
      success: true,
      data: subtitle,
    });
  });

  /**
   * Delete subtitle
   * DELETE /api/teacher/lessons/:lessonId/subtitle/:subtitleId
   */
  static deleteSubtitle = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { subtitleId } = req.params;
    const userId = req.user!.id;

    await SubtitleService.deleteSubtitle(subtitleId, userId);

    res.json({
      success: true,
      message: 'Subtitle deleted successfully',
    });
  });

  /**
   * Update subtitle language
   * PUT /api/teacher/lessons/:lessonId/subtitle/:subtitleId
   */
  static updateSubtitle = asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const { subtitleId } = req.params;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required',
      });
    }

    const subtitle = await SubtitleService.updateSubtitleLanguage(subtitleId, language);

    res.json({
      success: true,
      message: 'Subtitle updated successfully',
      data: subtitle,
    });
  });
}

// Export multer middleware for video upload
export const videoUploadMiddleware = multerInstances.singleVideo.single('video');
export const subtitleUploadMiddleware = multerInstances.singleDocument.single('subtitle');
