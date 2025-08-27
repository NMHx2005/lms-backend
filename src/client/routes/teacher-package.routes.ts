import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as teacherPackageController from '../controllers/teacher-package.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET current teacher subscription and remaining quota
router.get('/me', teacherPackageController.getMySubscription);

// GET available packages (active ones)
router.get('/packages', teacherPackageController.listActivePackages);

export default router;


