import { Request, Response } from 'express';
import { PackagePlan, TeacherPackageSubscription } from '../../shared/models';

// Packages
export const listPackages = async (req: Request, res: Response) => {
  try {
    const { search, isActive } = req.query as any;
    const filters: any = {};
    if (typeof isActive === 'boolean') filters.isActive = isActive;
    if (search) filters.name = { $regex: search, $options: 'i' };
    const packages = await PackagePlan.find(filters).sort({ createdAt: -1 });
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createPackage = async (req: Request, res: Response) => {
  try {
    const pkg = await PackagePlan.create({
      name: req.body.name,
      description: req.body.description || '',
      maxCourses: req.body.maxCourses,
      price: req.body.price,
      billingCycle: req.body.billingCycle,
      features: Array.isArray(req.body.features) ? req.body.features : [],
      isActive: req.body.isActive ?? true,
      version: 1,
    });
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const getPackage = async (req: Request, res: Response) => {
  try {
    const pkg = await PackagePlan.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, error: 'Package not found' });
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const updatePackage = async (req: Request, res: Response) => {
  try {
    const pkg = await PackagePlan.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, error: 'Package not found' });

    const fieldsThatChangeVersion = ['maxCourses', 'price', 'billingCycle', 'features', 'name', 'description'];
    const shouldBump = fieldsThatChangeVersion.some((f) => f in req.body);
    Object.assign(pkg, req.body);
    if (shouldBump) pkg.version = (pkg.version || 1) + 1;
    await pkg.save();
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deletePackage = async (req: Request, res: Response) => {
  try {
    const pkg = await PackagePlan.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, error: 'Package not found' });

    const countSubs = await TeacherPackageSubscription.countDocuments({ packageId: pkg._id, status: 'active' });
    if (countSubs > 0) {
      pkg.isActive = false;
      await pkg.save();
      return res.json({ success: true, data: pkg, message: 'Package deactivated due to active subscriptions' });
    }

    await pkg.deleteOne();
    res.json({ success: true, message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Subscriptions
export const listSubscriptions = async (req: Request, res: Response) => {
  try {
    const { teacherId, status } = req.query as any;
    const filters: any = {};
    if (teacherId) filters.teacherId = teacherId;
    if (status) filters.status = status;
    const subs = await TeacherPackageSubscription.find(filters).sort({ createdAt: -1 });
    res.json({ success: true, data: subs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const pkg = await PackagePlan.findById(req.body.packageId);
    if (!pkg || !pkg.isActive) {
      return res.status(400).json({ success: false, error: 'Invalid or inactive package' });
    }

    const startAt = req.body.startAt ? new Date(req.body.startAt) : new Date();
    let endAt: Date;
    if (req.body.endAt) {
      endAt = new Date(req.body.endAt);
    } else {
      endAt = new Date(startAt);
      if (pkg.billingCycle === 'monthly') endAt.setMonth(endAt.getMonth() + 1);
      else endAt.setFullYear(endAt.getFullYear() + 1);
    }

    const sub = await TeacherPackageSubscription.create({
      teacherId: req.body.teacherId,
      packageId: pkg._id,
      status: 'active',
      startAt,
      endAt,
      snapshot: {
        name: pkg.name,
        maxCourses: pkg.maxCourses,
        billingCycle: pkg.billingCycle,
        features: pkg.features || [],
        version: pkg.version || 1,
        price: pkg.price,
      },
    });
    res.status(201).json({ success: true, data: sub });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const sub = await TeacherPackageSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

    const action = req.body.action as 'cancel' | 'renew' | 'expire';
    if (action === 'cancel') {
      sub.status = 'cancelled';
    } else if (action === 'expire') {
      sub.status = 'expired';
      sub.endAt = req.body.endAt ? new Date(req.body.endAt) : new Date();
    } else if (action === 'renew') {
      const now = new Date();
      sub.startAt = now;
      if (sub.snapshot.billingCycle === 'monthly') {
        sub.endAt = new Date(now);
        sub.endAt.setMonth(sub.endAt.getMonth() + 1);
      } else {
        sub.endAt = new Date(now);
        sub.endAt.setFullYear(sub.endAt.getFullYear() + 1);
      }
      sub.status = 'active';
      sub.renewedAt = now;
    }

    await sub.save();
    res.json({ success: true, data: sub });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};


