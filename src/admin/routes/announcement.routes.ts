import { Router } from 'express';
import { AdminAnnouncementController } from '../controllers/announcement.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { adminAnnouncementValidation } from '../validators/announcement.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// CRUD Routes
router.post(
  '/',
  validateRequest(adminAnnouncementValidation.createAnnouncement),
  AdminAnnouncementController.createAnnouncement
);

router.get(
  '/',
  validateRequest(adminAnnouncementValidation.getAnnouncements),
  AdminAnnouncementController.getAnnouncements
);

router.get(
  '/stats',
  validateRequest(adminAnnouncementValidation.getStats),
  AdminAnnouncementController.getAnnouncementStats
);

router.get(
  '/:id',
  validateRequest(adminAnnouncementValidation.getById),
  AdminAnnouncementController.getAnnouncementById
);

router.put(
  '/:id',
  validateRequest(adminAnnouncementValidation.updateAnnouncement),
  AdminAnnouncementController.updateAnnouncement
);

router.delete(
  '/:id',
  validateRequest(adminAnnouncementValidation.deleteAnnouncement),
  AdminAnnouncementController.deleteAnnouncement
);

// Action Routes
router.post(
  '/:id/publish',
  validateRequest(adminAnnouncementValidation.publishAnnouncement),
  AdminAnnouncementController.publishAnnouncement
);

router.post(
  '/:id/cancel',
  validateRequest(adminAnnouncementValidation.cancelAnnouncement),
  AdminAnnouncementController.cancelAnnouncement
);

router.get(
  '/:id/analytics',
  validateRequest(adminAnnouncementValidation.getAnalytics),
  AdminAnnouncementController.getAnnouncementAnalytics
);

// Bulk Operations
router.post(
  '/bulk/publish',
  validateRequest(adminAnnouncementValidation.bulkPublish),
  AdminAnnouncementController.bulkPublishAnnouncements
);

router.post(
  '/bulk/delete',
  validateRequest(adminAnnouncementValidation.bulkDelete),
  AdminAnnouncementController.bulkDeleteAnnouncements
);

export default router;
