import { Request, Response } from 'express';
import { ProgressService } from '../services/progress.service';

export class ProgressController {
    // Mark lesson as completed
    static async markLessonCompleted(req: Request, res: Response) {
        try {
            const { courseId, lessonId } = req.params;
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const result = await ProgressService.markLessonCompleted(courseId, lessonId, userId);

            res.json({
                success: true,
                data: result,
                message: 'Lesson marked as completed'
            });
        } catch (error: any) {
            console.error('Mark lesson completed error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to mark lesson as completed'
            });
        }
    }

    // Get lesson progress
    static async getLessonProgress(req: Request, res: Response) {
        try {
            const { courseId, lessonId } = req.params;
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const progress = await ProgressService.getLessonProgress(courseId, lessonId, userId);

            res.json({
                success: true,
                data: progress
            });
        } catch (error: any) {
            console.error('Get lesson progress error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get lesson progress'
            });
        }
    }

    // Get course progress
    static async getCourseProgress(req: Request, res: Response) {
        try {
            const { courseId } = req.params;
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const progress = await ProgressService.getCourseProgress(courseId, userId);

            res.json({
                success: true,
                data: progress
            });
        } catch (error: any) {
            console.error('Get course progress error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to get course progress'
            });
        }
    }

    // Add time spent on lesson
    static async addTimeSpent(req: Request, res: Response) {
        try {
            const { courseId, lessonId } = req.params;
            const { seconds } = req.body;
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const result = await ProgressService.addTimeSpent(courseId, lessonId, userId, seconds);

            res.json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.error('Add time spent error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to add time spent'
            });
        }
    }
}
