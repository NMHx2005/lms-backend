import { Request, Response } from 'express';
import { PackagePlan, TeacherPackageSubscription, Course } from '../../shared/models';

export const getMySubscription = async (req: any, res: Response) => {
  try {
    const teacherId = req.user.id;
    const now = new Date();
    const sub = await TeacherPackageSubscription.findOne({
      teacherId,
      status: 'active',
      endAt: { $gt: now },
    }).sort({ endAt: -1 });

    if (!sub) return res.json({ success: true, data: null });

    const countCourses = await Course.countDocuments({ instructorId: teacherId });
    const maxCourses = sub.snapshot.maxCourses || 0;

    res.json({
      success: true,
      data: {
        subscription: sub,
        quota: {
          maxCourses,
          used: countCourses,
          remaining: Math.max(0, maxCourses - countCourses),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const listActivePackages = async (_req: Request, res: Response) => {
  try {
    const packages = await PackagePlan.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};


