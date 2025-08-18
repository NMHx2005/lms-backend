import { Router } from 'express';
import { ClientAnnouncementController } from '../controllers/announcement.controller';
import { authenticate, requireStudent } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/middleware/validation';
import { clientAnnouncementValidation } from '../validators/announcement.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireStudent);

// User announcement routes
router.get(
  '/',
  validateRequest(clientAnnouncementValidation.getMyAnnouncements),
  ClientAnnouncementController.getMyAnnouncements
);

router.get(
  '/summary',
  validateRequest(clientAnnouncementValidation.getAnnouncementSummary),
  ClientAnnouncementController.getAnnouncementSummary
);

router.get(
  '/urgent',
  validateRequest(clientAnnouncementValidation.getUrgentAnnouncements),
  ClientAnnouncementController.getUrgentAnnouncements
);

router.get(
  '/search',
  validateRequest(clientAnnouncementValidation.searchAnnouncements),
  ClientAnnouncementController.searchAnnouncements
);

router.get(
  '/course/:courseId',
  validateRequest(clientAnnouncementValidation.getCourseAnnouncements),
  ClientAnnouncementController.getCourseAnnouncements
);

router.get(
  '/:id',
  validateRequest(clientAnnouncementValidation.getById),
  ClientAnnouncementController.getAnnouncementById
);

// Action routes
router.post(
  '/:id/acknowledge',
  validateRequest(clientAnnouncementValidation.acknowledgeAnnouncement),
  ClientAnnouncementController.acknowledgeAnnouncement
);

router.post(
  '/:id/track-click',
  validateRequest(clientAnnouncementValidation.trackClick),
  ClientAnnouncementController.trackAnnouncementClick
);

export default router;
