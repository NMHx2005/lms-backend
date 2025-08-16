import { Router } from 'express';
import { testConnection, getDBStats } from '../config/database';
import { getCorsSummary } from '../utils/corsTest';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const dbStats = await getDBStats();

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      cors: getCorsSummary(),
      database: {
        status: dbStatus ? 'connected' : 'disconnected',
        stats: dbStats,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      version: process.version,
    };

    if (dbStatus) {
      res.status(200).json(healthStatus);
    } else {
      healthStatus.status = 'degraded';
      res.status(503).json(healthStatus);
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Ready endpoint for Kubernetes readiness probe
router.get('/ready', async (req, res) => {
  try {
    const dbStatus = await testConnection();

    if (dbStatus) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

// Live endpoint for Kubernetes liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
