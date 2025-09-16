import { Request, Response } from 'express';
import { StudyGroupService } from '../services/study-group.service';

export class StudyGroupController {
    static async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const { name, description, courseId, maxMembers, isPrivate, tags } = req.body;
            if (!name || typeof name !== 'string') return res.status(400).json({ success: false, error: 'Name is required' });
            const group = await StudyGroupService.createGroup({ name, description, courseId, maxMembers, isPrivate, tags }, userId);
            res.json({ success: true, data: group });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message || 'Failed to create group' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const group = await StudyGroupService.updateGroup(req.params.groupId, req.body, userId);
            if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
            res.json({ success: true, data: group });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message || 'Failed to update group' });
        }
    }

    static async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const ok = await StudyGroupService.deleteGroup(req.params.groupId, userId);
            if (!ok) return res.status(404).json({ success: false, error: 'Group not found' });
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message || 'Failed to delete group' });
        }
    }

    static async listPublic(req: Request, res: Response) {
        try {
            const { page = 1, limit = 10, search, courseId, tags } = req.query as any;
            const result = await StudyGroupService.listPublic({
                page: Number(page),
                limit: Number(limit),
                search: search as string,
                courseId: courseId as string,
                tags: typeof tags === 'string' ? (tags as string).split(',') : (tags as string[] | undefined),
            });
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message || 'Failed to list groups' });
        }
    }

    static async listMine(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const { page = 1, limit = 10 } = req.query;
            const result = await StudyGroupService.listMyGroups(userId, Number(page), Number(limit));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message || 'Failed to list my groups' });
        }
    }

    static async listJoined(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const { page = 1, limit = 10 } = req.query;
            const result = await StudyGroupService.listJoinedGroups(userId, Number(page), Number(limit));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message || 'Failed to list joined groups' });
        }
    }

    static async detail(req: Request, res: Response) {
        try {
            const doc = await StudyGroupService.getDetail(req.params.groupId);
            if (!doc) return res.status(404).json({ success: false, error: 'Group not found' });
            res.json({ success: true, data: doc });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message || 'Failed to get group detail' });
        }
    }

    static async join(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const doc = await StudyGroupService.joinGroup(req.params.groupId, userId);
            res.json({ success: true, data: doc });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message || 'Failed to join group' });
        }
    }

    static async leave(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const doc = await StudyGroupService.leaveGroup(req.params.groupId, userId);
            res.json({ success: true, data: doc });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message || 'Failed to leave group' });
        }
    }

    static async transfer(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
            const { newCreatorId } = req.body;
            if (!newCreatorId) return res.status(400).json({ success: false, error: 'newCreatorId is required' });
            const doc = await StudyGroupService.transferOwnership(req.params.groupId, newCreatorId, userId);
            res.json({ success: true, data: doc });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message || 'Failed to transfer ownership' });
        }
    }
}


