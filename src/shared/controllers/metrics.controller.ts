import { Request, Response } from 'express';
import os from 'os';
import process from 'process';

const routeStats: Record<string, { count: number; totalMs: number; errors: number }> = {};

export const metricsMiddleware = (req: Request, res: Response, next: Function) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const key = `${req.method} ${req.route ? req.route.path : req.path}`;
    routeStats[key] = routeStats[key] || { count: 0, totalMs: 0, errors: 0 };
    routeStats[key].count += 1;
    routeStats[key].totalMs += ms;
    if (res.statusCode >= 400) routeStats[key].errors += 1;
  });
  next();
};

export class MetricsController {
  static async system(req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpuLoad: os.loadavg(),
        platform: process.platform,
        nodeVersion: process.version,
        cpus: os.cpus().length,
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
      }
    });
  }

  static async api(req: Request, res: Response) {
    const metrics = Object.entries(routeStats).map(([route, s]) => ({
      route,
      count: s.count,
      avgMs: s.count ? Math.round((s.totalMs / s.count) * 100) / 100 : 0,
      errorRate: s.count ? Math.round((s.errors / s.count) * 10000) / 100 : 0,
    }));
    return res.json({ success: true, data: metrics });
  }
}


