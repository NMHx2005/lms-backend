import app from './app';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { webSocketService } from './shared/services/websocket/websocket.service';
import connectDB from './shared/config/database';
import { reloadAllSchedules, scheduleRunner } from './shared/services/reports/schedule.service';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Async server startup
async function startServer() {
  try {
    // Connect to database first
    await connectDB();
    console.log('✅ Database connected successfully');

    // Initialize scheduled reports after database connection
    try {
      await reloadAllSchedules(scheduleRunner);
      console.log('📅 Scheduled reports initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize scheduled reports:', (error as Error).message);
    }

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket service
    webSocketService.initialize(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 Admin API: http://localhost:${PORT}/api/admin`);
      console.log(`👤 Client API: http://localhost:${PORT}/api/client`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🔌 WebSocket: http://localhost:${PORT} (Real-time notifications enabled)`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
