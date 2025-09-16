import mongoose from 'mongoose';
import StudyGroup, { IStudyGroup } from '../../shared/models/extended/StudyGroup';

export class StudyGroupService {
    static async createGroup(payload: {
        name: string;
        description?: string;
        courseId?: string;
        maxMembers?: number;
        isPrivate?: boolean;
        tags?: string[];
    }, creatorId: string): Promise<IStudyGroup> {
        const doc = await StudyGroup.create({
            name: payload.name,
            description: payload.description,
            courseId: payload.courseId ? new mongoose.Types.ObjectId(payload.courseId) : undefined,
            creatorId: new mongoose.Types.ObjectId(creatorId),
            maxMembers: payload.maxMembers,
            isPrivate: payload.isPrivate ?? false,
            tags: payload.tags ?? [],
        });
        return doc;
    }

    static async updateGroup(groupId: string, payload: Partial<Pick<IStudyGroup,
        'name' | 'description' | 'maxMembers' | 'isPrivate' | 'tags' | 'isActive'>>,
        userId: string): Promise<IStudyGroup | null> {
        const group = await StudyGroup.findById(groupId);
        if (!group) return null;
        if (!group.creatorId.equals(new mongoose.Types.ObjectId(userId))) {
            throw new Error('Only the creator can update the group');
        }
        if (payload.name !== undefined) group.name = payload.name;
        if (payload.description !== undefined) group.description = payload.description as any;
        if (payload.maxMembers !== undefined) group.maxMembers = payload.maxMembers as any;
        if (payload.isPrivate !== undefined) group.isPrivate = payload.isPrivate as any;
        if (payload.tags !== undefined) group.tags = payload.tags as any;
        if (payload.isActive !== undefined) group.isActive = payload.isActive as any;
        await group.save();
        return group;
    }

    static async deleteGroup(groupId: string, userId: string): Promise<boolean> {
        const group = await StudyGroup.findById(groupId);
        if (!group) return false;
        if (!group.creatorId.equals(new mongoose.Types.ObjectId(userId))) {
            throw new Error('Only the creator can delete the group');
        }
        await group.deleteOne();
        return true;
    }

    static async listMyGroups(userId: string, page = 1, limit = 10) {
        const q = { creatorId: new mongoose.Types.ObjectId(userId), isActive: true } as any;
        const [items, total] = await Promise.all([
            StudyGroup.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            StudyGroup.countDocuments(q)
        ]);
        return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
    }

    static async listJoinedGroups(userId: string, page = 1, limit = 10) {
        const q = { members: new mongoose.Types.ObjectId(userId), isActive: true } as any;
        const [items, total] = await Promise.all([
            StudyGroup.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            StudyGroup.countDocuments(q)
        ]);
        return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
    }

    static async listPublic(params: { page?: number; limit?: number; search?: string; courseId?: string; tags?: string[]; }) {
        const { page = 1, limit = 10, search, courseId, tags } = params;
        const q: any = { isActive: true, isPrivate: false };
        if (courseId) q.courseId = new mongoose.Types.ObjectId(courseId);
        if (tags && tags.length) q.tags = { $in: tags };
        if (search) q.name = { $regex: search, $options: 'i' };
        const [items, total] = await Promise.all([
            StudyGroup.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            StudyGroup.countDocuments(q)
        ]);
        return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
    }

    static async getDetail(groupId: string) {
        return StudyGroup.findById(groupId);
    }

    static async joinGroup(groupId: string, userId: string) {
        const group = await StudyGroup.findById(groupId);
        if (!group) throw new Error('Group not found');
        // Ensure user is not already a member
        const userObjectId = new mongoose.Types.ObjectId(userId);
        if (group.members.some((m: mongoose.Types.ObjectId) => m.equals(userObjectId))) {
            throw new Error('User already joined this group');
        }
        group.members.push(userObjectId);
        await group.save();
        return group;
    }

    static async leaveGroup(groupId: string, userId: string) {
        const group = await StudyGroup.findById(groupId);
        if (!group) throw new Error('Group not found');
        const userObjectId = new mongoose.Types.ObjectId(userId);
        if (!group.members.some((m: mongoose.Types.ObjectId) => m.equals(userObjectId))) {
            throw new Error('User is not a member of this group');
        }
        group.members = group.members.filter((m: mongoose.Types.ObjectId) => !m.equals(userObjectId));
        await group.save();
        return group;
    }

    static async transferOwnership(groupId: string, newCreatorId: string, userId: string) {
        const group = await StudyGroup.findById(groupId);
        if (!group) throw new Error('Group not found');
        if (!group.creatorId.equals(new mongoose.Types.ObjectId(userId))) {
            throw new Error('Only the creator can transfer ownership');
        }
        const newCreatorObjectId = new mongoose.Types.ObjectId(newCreatorId);
        if (!group.members.some((m: mongoose.Types.ObjectId) => m.equals(newCreatorObjectId))) {
            throw new Error('New creator must be a member of this group');
        }
        group.creatorId = newCreatorObjectId;
        await group.save();
        return group;
    }
}


