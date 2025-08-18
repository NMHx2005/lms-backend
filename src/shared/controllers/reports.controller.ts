import { Request, Response } from 'express';
import { generateSimplePdfBuffer } from '../services/reports/pdf.service';
import ReportSchedule from '../models/analytics/ReportSchedule';
import { startSchedule, stopSchedule, scheduleRunner } from '../services/reports/schedule.service';
import Payment from '../models/payment/Payment';
import User from '../models/core/User';
import Course from '../models/core/Course';

const toCSV = (rows: any[]) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
  }
  return lines.join('\n');
};

export class ReportsController {
  static async exportCsv(req: Request, res: Response) {
    const { type = 'users' } = req.query as any;
    const data = [{ id: 1, type, note: 'sample' }];
    const csv = toCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
    return res.send(csv);
  }

  static async exportPdf(req: Request, res: Response) {
    const { type = 'users' } = req.query as any;
    const title = `Report: ${type}`;
    let sections: { title: string; lines: string[] }[] = [];
    if (type === 'revenue') {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const agg = await Payment.aggregate([
        { $match: { status: 'PAID', createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      const total = agg.reduce((s, r) => s + (r.amount || 0), 0);
      sections.push({ title: 'Revenue (last 30 days)', lines: [`Total: ${total.toLocaleString()} VND`, ...agg.map((r: any) => `${r._id}: ${r.amount} (${r.count})`)] });
    } else if (type === 'users') {
      const total = await User.countDocuments({});
      sections.push({ title: 'Users', lines: [`Total users: ${total}`] });
    } else if (type === 'courses') {
      const total = await Course.countDocuments({});
      sections.push({ title: 'Courses', lines: [`Total courses: ${total}`] });
    } else {
      sections.push({ title: String(type), lines: ['No specific data source implemented yet.'] });
    }
    const pdf = await generateSimplePdfBuffer(title, sections);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.pdf"`);
    return res.send(pdf);
  }

  static async createSchedule(req: Request, res: Response) {
    const { name, type, format = 'csv', cron, recipients = [] } = req.body || {};
    const creatorId = (req as any).user?.id;
    const doc = await ReportSchedule.create({ name, type, format, cron, recipients, creatorId });
    startSchedule(String(doc._id), cron, async () => scheduleRunner(doc));
    return res.json({ success: true, data: doc });
  }

  static async listSchedules(req: Request, res: Response) {
    const creatorId = (req as any).user?.id;
    const list = await ReportSchedule.find({ creatorId }).sort({ createdAt: -1 });
    return res.json({ success: true, data: list });
  }

  static async deleteSchedule(req: Request, res: Response) {
    const { id } = req.params;
    await ReportSchedule.findByIdAndDelete(id);
    stopSchedule(id);
    return res.json({ success: true });
  }

  static async customReport(req: Request, res: Response) {
    const { collection = 'payments', dimensions = [], metrics = [], filters = {} } = req.body || {};
    const Model = collection === 'payments' ? Payment : collection === 'users' ? User : collection === 'courses' ? Course : null as any;
    if (!Model) return res.status(400).json({ success: false, message: 'Unsupported collection' });
    const pipeline: any[] = [];
    if (filters && Object.keys(filters).length) pipeline.push({ $match: filters });
    const group: any = { _id: {} };
    for (const d of dimensions) group._id[d] = `$${d}`;
    for (const m of metrics) {
      if (m === 'count') group.count = { $sum: 1 };
      if (m === 'sum_amount') group.sum_amount = { $sum: '$amount' };
    }
    pipeline.push({ $group: group });
    pipeline.push({ $sort: { _id: 1 } });
    const rows = await Model.aggregate(pipeline);
    return res.json({ success: true, data: { dimensions, metrics, filters, rows } });
  }

  static async templates(req: Request, res: Response) {
    return res.json({ success: true, data: [{ id: 'tpl_users', name: 'Users Summary' }, { id: 'tpl_revenue', name: 'Revenue Summary' }] });
  }
}


