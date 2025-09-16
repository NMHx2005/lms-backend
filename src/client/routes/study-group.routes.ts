import express from 'express';
import { StudyGroupController } from '../controllers/study-group.controller';

const router = express.Router();

// Auth required lists and mutations will be protected by parent authenticate middleware
router.get('/', StudyGroupController.listMine);
router.get('/joined/me', StudyGroupController.listJoined);
router.post('/', StudyGroupController.create);
router.put('/:groupId', StudyGroupController.update);
router.delete('/:groupId', StudyGroupController.remove);
router.post('/:groupId/join', StudyGroupController.join);
router.post('/:groupId/leave', StudyGroupController.leave);
router.post('/:groupId/transfer', StudyGroupController.transfer);

export default router;


