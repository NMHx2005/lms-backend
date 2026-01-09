import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/utils/appError';
import { BackupService } from '../services/backup.service';

export class BackupController {
    /**
     * Get all backups with pagination
     * GET /api/admin/backups
     */
    static getBackups = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10, status, type } = req.query;

            const filters = {
                page: Number(page),
                limit: Number(limit),
                status: status as string,
                type: type as string
            };

            const result = await BackupService.getBackups(filters);

            res.status(200).json({
                success: true,
                message: 'Backups retrieved successfully',
                data: result.backups,
                pagination: result.pagination
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to retrieve backups'
            });
        }
    });

    /**
     * Create a new backup
     * POST /api/admin/backups
     */
    static createBackup = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { name, description, type = 'full', includeFiles = true } = req.body;

            const backup = await BackupService.createBackup({
                name,
                description,
                type,
                includeFiles,
                createdBy: (req.user as any)?.id
            });

            res.status(201).json({
                success: true,
                message: 'Backup created successfully',
                data: backup
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to create backup'
            });
        }
    });

    /**
     * Get backup by ID
     * GET /api/admin/backups/:id
     */
    static getBackupById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const backup = await BackupService.getBackupById(id);

            if (!backup) {
                return res.status(404).json({
                    success: false,
                    error: 'Backup not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Backup retrieved successfully',
                data: backup
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to retrieve backup'
            });
        }
    });

    /**
     * Delete backup
     * DELETE /api/admin/backups/:id
     */
    static deleteBackup = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            await BackupService.deleteBackup(id);

            res.status(200).json({
                success: true,
                message: 'Backup deleted successfully'
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to delete backup'
            });
        }
    });

    /**
     * Restore from backup
     * POST /api/admin/backups/:id/restore
     */
    static restoreBackup = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const restoreJob = await BackupService.restoreBackup(id, {
                name,
                description,
                createdBy: (req.user as any)?.id
            });

            res.status(201).json({
                success: true,
                message: 'Restore job created successfully',
                data: restoreJob
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to create restore job'
            });
        }
    });

    /**
     * Get all restore jobs with pagination
     * GET /api/admin/restore-jobs
     */
    static getRestoreJobs = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10, status } = req.query;

            const filters = {
                page: Number(page),
                limit: Number(limit),
                status: status as string
            };

            const result = await BackupService.getRestoreJobs(filters);

            res.status(200).json({
                success: true,
                message: 'Restore jobs retrieved successfully',
                data: result.restoreJobs,
                pagination: result.pagination
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to retrieve restore jobs'
            });
        }
    });

    /**
     * Get restore job by ID
     * GET /api/admin/restore-jobs/:id
     */
    static getRestoreJobById = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const restoreJob = await BackupService.getRestoreJobById(id);

            if (!restoreJob) {
                return res.status(404).json({
                    success: false,
                    error: 'Restore job not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Restore job retrieved successfully',
                data: restoreJob
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to retrieve restore job'
            });
        }
    });

    /**
     * Cancel restore job
     * POST /api/admin/restore-jobs/:id/cancel
     */
    static cancelRestoreJob = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            await BackupService.cancelRestoreJob(id);

            res.status(200).json({
                success: true,
                message: 'Restore job cancelled successfully'
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to cancel restore job'
            });
        }
    });

    /**
     * Get all backup schedules
     * GET /api/admin/backup-schedules
     */
    static getBackupSchedules = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10, status } = req.query;

            const filters = {
                page: Number(page),
                limit: Number(limit),
                status: status as string
            };

            const result = await BackupService.getBackupSchedules(filters);

            res.status(200).json({
                success: true,
                message: 'Backup schedules retrieved successfully',
                data: result.schedules,
                pagination: result.pagination
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to retrieve backup schedules'
            });
        }
    });

    /**
     * Create backup schedule
     * POST /api/admin/backup-schedules
     */
    static createBackupSchedule = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { name, description, cronExpression, type = 'full', enabled = true } = req.body;

            const schedule = await BackupService.createBackupSchedule({
                name,
                description,
                cronExpression,
                type,
                enabled,
                createdBy: (req.user as any)?.id
            });

            res.status(201).json({
                success: true,
                message: 'Backup schedule created successfully',
                data: schedule
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to create backup schedule'
            });
        }
    });

    /**
     * Update backup schedule
     * PUT /api/admin/backup-schedules/:id
     */
    static updateBackupSchedule = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const schedule = await BackupService.updateBackupSchedule(id, updates);

            res.status(200).json({
                success: true,
                message: 'Backup schedule updated successfully',
                data: schedule
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to update backup schedule'
            });
        }
    });

    /**
     * Delete backup schedule
     * DELETE /api/admin/backup-schedules/:id
     */
    static deleteBackupSchedule = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            await BackupService.deleteBackupSchedule(id);

            res.status(200).json({
                success: true,
                message: 'Backup schedule deleted successfully'
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to delete backup schedule'
            });
        }
    });

    /**
     * Run backup schedule manually
     * POST /api/admin/backup-schedules/:id/run
     */
    static runBackupSchedule = asyncHandler(async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const backup = await BackupService.runBackupSchedule(id, (req.user as any)?.id);

            res.status(201).json({
                success: true,
                message: 'Backup schedule executed successfully',
                data: backup
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to run backup schedule'
            });
        }
    });

    /**
     * Get backup settings
     * GET /api/admin/backup-settings
     */
    static getBackupSettings = asyncHandler(async (req: Request, res: Response) => {
        try {
            const settings = await BackupService.getBackupSettings();

            res.status(200).json({
                success: true,
                message: 'Backup settings retrieved successfully',
                data: settings
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to retrieve backup settings'
            });
        }
    });

    /**
     * Update backup settings
     * PUT /api/admin/backup-settings
     */
    static updateBackupSettings = asyncHandler(async (req: Request, res: Response) => {
        try {
            const updates = req.body;

            const settings = await BackupService.updateBackupSettings(updates);

            res.status(200).json({
                success: true,
                message: 'Backup settings updated successfully',
                data: settings
            });
        } catch (error: any) {

            res.status(500).json({
                success: false,
                error: error?.message || 'Failed to update backup settings'
            });
        }
    });
}

export default BackupController;
