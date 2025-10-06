import { Router } from 'express';
import { UserActivityLog } from '../../shared/models';
import { generateSimplePdfBuffer } from '../../shared/services/reports/pdf.service';

const router = Router();

router.get('/', async (req: any, res) => {
  try {
    const { userId, courseId, action, start, end, page = 1, limit = 20 } = req.query as any;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (courseId) filter.courseId = courseId;
    if (action) filter.action = action;
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = new Date(start);
      if (end) filter.createdAt.$lte = new Date(end);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      (UserActivityLog as any).find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      (UserActivityLog as any).countDocuments(filter)
    ]);
    res.json({ success: true, data: { items, page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Internal error' });
  }
});

export default router;

// Helpers
function buildFilter(q: any) {
  const { userId, courseId, action, start, end } = q || {};
  const filter: any = {};
  if (userId) filter.userId = userId;
  if (courseId) filter.courseId = courseId;
  if (action) filter.action = action;
  if (start || end) {
    filter.createdAt = {};
    if (start) filter.createdAt.$gte = new Date(start);
    if (end) filter.createdAt.$lte = new Date(end);
  }
  return filter;
}

function toCSV(rows: any[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
  return lines.join('\n');
}

router.get('/export.csv', async (req: any, res) => {
  try {
    const filter = buildFilter(req.query);
    const items = await (UserActivityLog as any).find(filter).sort({ createdAt: -1 }).limit(5000);
    const rows = items.map((i: any) => ({
      id: String(i._id),
      userId: String(i.userId),
      action: i.action,
      resource: i.resource,
      resourceId: i.resourceId ? String(i.resourceId) : '',
      courseId: i.courseId ? String(i.courseId) : '',
      lessonId: i.lessonId ? String(i.lessonId) : '',
      duration: i.duration ?? '',
      createdAt: i.createdAt.toISOString()
    }));
    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity.csv"');
    return res.send(csv);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Internal error' });
  }
});

router.get('/export.pdf', async (req: any, res) => {
  try {
    const filter = buildFilter(req.query);
    const total = await (UserActivityLog as any).countDocuments(filter);
    const recent = await (UserActivityLog as any).find(filter).sort({ createdAt: -1 }).limit(20);
    const lines = [
      `Total activities: ${total}`,
      'Recent:',
      ...recent.map((i: any) => `${i.createdAt.toISOString()} - ${i.action} ${i.resource} (${i.userId})`)
    ];
    const pdf = await generateSimplePdfBuffer('Activity Report', [{ title: 'Summary', lines }]);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="activity.pdf"');
    return res.send(pdf);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Internal error' });
  }
});

router.get('/summary', async (req: any, res) => {
  try {
    const filter = buildFilter(req.query);
    const pipeline: any[] = [];
    if (Object.keys(filter).length) pipeline.push({ $match: filter });
    pipeline.push({ $group: { _id: { action: '$action' }, count: { $sum: 1 } } });
    pipeline.push({ $sort: { count: -1 } });
    const byAction = await (UserActivityLog as any).aggregate(pipeline);
    res.json({ success: true, data: { byAction } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Internal error' });
  }
});

// Preset filters
router.get('/presets/learning', async (req: any, res) => {
  const q = { ...req.query };
  const filter = buildFilter({ ...q, action: { $in: ['course_view', 'course_enroll', 'course_complete', 'section_view', 'lesson_view', 'lesson_complete', 'lesson_pause'] } });
  const skip = (Number(q.page || 1) - 1) * Number(q.limit || 20);
  const [items, total] = await Promise.all([
    (UserActivityLog as any).find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(q.limit || 20)),
    (UserActivityLog as any).countDocuments(filter)
  ]);
  res.json({ success: true, data: { items, page: Number(q.page || 1), limit: Number(q.limit || 20), total, pages: Math.ceil(total / Number(q.limit || 20)) } });
});

router.get('/presets/payment', async (req: any, res) => {
  const q = { ...req.query, action: { $in: ['payment_initiate', 'payment_complete', 'payment_failed', 'subscription_start', 'subscription_cancel', 'subscription_renew'] } } as any;
  const filter = buildFilter(q);
  const skip = (Number(q.page || 1) - 1) * Number(q.limit || 20);
  const [items, total] = await Promise.all([
    (UserActivityLog as any).find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(q.limit || 20)),
    (UserActivityLog as any).countDocuments(filter)
  ]);
  res.json({ success: true, data: { items, page: Number(q.page || 1), limit: Number(q.limit || 20), total, pages: Math.ceil(total / Number(q.limit || 20)) } });
});

router.get('/presets/system', async (req: any, res) => {
  const q = { ...req.query, action: { $in: ['login', 'logout', 'register', 'password_reset', 'email_verification', 'export', 'import'] } } as any;
  const filter = buildFilter(q);
  const skip = (Number(q.page || 1) - 1) * Number(q.limit || 20);
  const [items, total] = await Promise.all([
    (UserActivityLog as any).find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(q.limit || 20)),
    (UserActivityLog as any).countDocuments(filter)
  ]);
  res.json({ success: true, data: { items, page: Number(q.page || 1), limit: Number(q.limit || 20), total, pages: Math.ceil(total / Number(q.limit || 20)) } });
});


