import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
// mongoose import removed as it's not used
import connectDB from './config/database';
import { corsMiddleware } from './middleware/cors';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health & readiness endpoints
app.use('/health', healthRoutes);

// Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, error: 'Not Found', path: req.originalUrl });
});

// Error handling middleware (standardized envelope)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status =
      err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    const errorCode = err.errorCode ?? (status === 500 ? 9999 : undefined);
    if (status >= 500) {
      console.error(err);
    }
    res.status(status).json({
      success: false,
      error: err.message || 'Internal Server Error',
      ...(errorCode ? { errorCode } : {}),
    });
  }
);

export default app;
