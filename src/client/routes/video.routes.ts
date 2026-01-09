import { Router } from 'express';
import { VideoController, videoUploadMiddleware, subtitleUploadMiddleware } from '../controllers/video.controller';
import { authenticate } from '../middleware/auth';
import { requireTeacher } from '../../shared/middleware/auth';

const router = Router();

// ==================== VIDEO UPLOAD (Teacher only) ====================
router.post(
  '/teacher/lessons/:lessonId/video/upload',
  authenticate,
  requireTeacher,
  videoUploadMiddleware,
  VideoController.uploadVideo
);

router.get(
  '/teacher/lessons/:lessonId/video/status',
  authenticate,
  requireTeacher,
  VideoController.getVideoStatus
);

router.delete(
  '/teacher/lessons/:lessonId/video',
  authenticate,
  requireTeacher,
  VideoController.deleteVideo
);

// ==================== VIDEO FILE (All authenticated users) ====================
router.get(
  '/lessons/:lessonId/video',
  authenticate,
  VideoController.getVideoFile
);

// ==================== VIDEO PROGRESS (All authenticated users) ====================
router.post(
  '/lessons/:lessonId/progress',
  authenticate,
  VideoController.saveProgress
);

router.get(
  '/lessons/:lessonId/progress',
  authenticate,
  VideoController.getProgress
);

router.get(
  '/courses/:courseId/progress',
  authenticate,
  VideoController.getCourseProgress
);

router.post(
  '/lessons/:lessonId/complete',
  authenticate,
  VideoController.markCompleted
);

// ==================== VIDEO ANALYTICS ====================
// Student: Record events and view own analytics
router.post(
  '/lessons/:lessonId/analytics/event',
  authenticate,
  VideoController.recordEvent
);

router.get(
  '/lessons/:lessonId/analytics',
  authenticate,
  VideoController.getStudentAnalytics
);

// Teacher: View lesson and course analytics
router.get(
  '/teacher/lessons/:lessonId/analytics',
  authenticate,
  requireTeacher,
  VideoController.getLessonAnalytics
);

router.get(
  '/teacher/courses/:courseId/video-analytics',
  authenticate,
  requireTeacher,
  VideoController.getCourseAnalytics
);

// ==================== VIDEO NOTES (All authenticated users) ====================
router.post(
  '/lessons/:lessonId/notes',
  authenticate,
  VideoController.createNote
);

router.get(
  '/lessons/:lessonId/notes',
  authenticate,
  VideoController.getNotes
);

router.get(
  '/lessons/:lessonId/notes/public',
  authenticate,
  VideoController.getPublicNotes
);

router.put(
  '/lessons/:lessonId/notes/:noteId',
  authenticate,
  VideoController.updateNote
);

router.delete(
  '/lessons/:lessonId/notes/:noteId',
  authenticate,
  VideoController.deleteNote
);

router.get(
  '/lessons/:lessonId/notes/search',
  authenticate,
  VideoController.searchNotes
);

router.get(
  '/lessons/:lessonId/notes/export',
  authenticate,
  VideoController.exportNotes
);

// ==================== SUBTITLES ====================
// Teacher: Upload and manage subtitles
router.post(
  '/teacher/lessons/:lessonId/subtitle',
  authenticate,
  requireTeacher,
  subtitleUploadMiddleware,
  VideoController.uploadSubtitle
);

router.put(
  '/teacher/lessons/:lessonId/subtitle/:subtitleId',
  authenticate,
  requireTeacher,
  VideoController.updateSubtitle
);

router.delete(
  '/teacher/lessons/:lessonId/subtitle/:subtitleId',
  authenticate,
  requireTeacher,
  VideoController.deleteSubtitle
);

// All users: Get subtitles
router.get(
  '/lessons/:lessonId/subtitles',
  authenticate,
  VideoController.getSubtitles
);

router.get(
  '/lessons/:lessonId/subtitles/:language',
  authenticate,
  VideoController.getSubtitleByLanguage
);

export default router;
