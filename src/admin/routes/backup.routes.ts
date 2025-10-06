import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import BackupController from '../controllers/backup.controller';

const router = Router();

// Apply authentication and admin role middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// Backup Management
router.get('/backups', BackupController.getBackups);
router.post('/backups', BackupController.createBackup);
router.get('/backups/:id', BackupController.getBackupById);
router.delete('/backups/:id', BackupController.deleteBackup);
router.post('/backups/:id/restore', BackupController.restoreBackup);

// Restore Jobs
router.get('/restore-jobs', BackupController.getRestoreJobs);
router.get('/restore-jobs/:id', BackupController.getRestoreJobById);
router.post('/restore-jobs/:id/cancel', BackupController.cancelRestoreJob);

// Backup Schedules
router.get('/backup-schedules', BackupController.getBackupSchedules);
router.post('/backup-schedules', BackupController.createBackupSchedule);
router.put('/backup-schedules/:id', BackupController.updateBackupSchedule);
router.delete('/backup-schedules/:id', BackupController.deleteBackupSchedule);
router.post('/backup-schedules/:id/run', BackupController.runBackupSchedule);

// Backup Settings
router.get('/backup-settings', BackupController.getBackupSettings);
router.put('/backup-settings', BackupController.updateBackupSettings);

export default router;
