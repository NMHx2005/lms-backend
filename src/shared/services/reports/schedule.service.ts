import cron from 'node-cron';
import ReportSchedule from '../../models/analytics/ReportSchedule';
import Payment from '../../models/payment/Payment';
import User from '../../models/core/User';
import Course from '../../models/core/Course';
import { generateSimplePdfBuffer } from './pdf.service';

const toCSV = (rows: any[]) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
  }
  return lines.join('\n');
};

const buildDataForType = async (type: string) => {
  if (type === 'revenue') {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const agg = await Payment.aggregate([
      { $match: { status: 'PAID', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const total = agg.reduce((s, r) => s + (r.amount || 0), 0);
    return {
      title: 'Revenue (last 30 days)',
      lines: [`Total: ${total.toLocaleString()} VND`, ...agg.map((r: any) => `${r._id}: ${r.amount} (${r.count})`)],
      rows: agg
    };
  }
  if (type === 'users') {
    const total = await User.countDocuments({});
    return { title: 'Users', lines: [`Total users: ${total}`], rows: [{ metric: 'total', value: total }] };
  }
  if (type === 'courses') {
    const total = await Course.countDocuments({});
    return { title: 'Courses', lines: [`Total courses: ${total}`], rows: [{ metric: 'total', value: total }] };
  }
  return { title: type, lines: ['No data implemented'], rows: [] };
};

type ScheduleTask = {
  stop: () => void;
};

const runningTasks = new Map<string, ScheduleTask>();

export const startSchedule = (id: string, cronExpr: string, run: () => Promise<void>) => {
  stopSchedule(id);
  const task = cron.schedule(cronExpr, () => {
    run().catch((err) => console.error('Scheduled report error', id, err));
  });
  runningTasks.set(id, { stop: () => task.stop() });
};

export const stopSchedule = (id: string) => {
  const t = runningTasks.get(id);
  if (t) {
    t.stop();
    runningTasks.delete(id);
  }
};

export const reloadAllSchedules = async (runner: (sched: any) => Promise<void>) => {
  const list = await ReportSchedule.find({ isActive: true });
  for (const s of list) {
    startSchedule(String(s._id), s.cron, async () => runner(s));
  }
};

export const scheduleRunner = async (sched: any) => {
  const { type, format } = sched;
  const data = await buildDataForType(type);
  if (format === 'pdf') {
    await generateSimplePdfBuffer(`Report: ${type}`, [{ title: data.title, lines: data.lines }]);
  } else {
    toCSV(data.rows);
  }
  await ReportSchedule.findByIdAndUpdate(sched._id, { $set: { lastRunAt: new Date() } });
};



