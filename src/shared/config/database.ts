import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Disable Mongoose buffering globally to fail fast if not connected
mongoose.set('bufferCommands', false);

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database';

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 30000, // Try server selection for up to 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  // Note: bufferCommands is not a valid connect option; use mongoose.set above
  autoIndex: process.env.NODE_ENV === 'development', // Build indexes in development
} as const;

// MongoDB connection function
export const connectDB = async (): Promise<void> => {
  try {

    console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    const conn = await mongoose.connect(MONGODB_URI, mongoOptions);

    // Verify connection is actually ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`MongoDB connection not ready. State: ${mongoose.connection.readyState}`);
    }



    console.log(`📡 Ready State: ${mongoose.connection.readyState} (1 = connected)`);

    // Handle connection events
    mongoose.connection.on('error', err => {

    });

    mongoose.connection.on('disconnected', () => {

    });

    mongoose.connection.on('reconnected', () => {

    });

    // Graceful shutdown
    process.on('SIGINT', async () => {

      await mongoose.connection.close();

      process.exit(0);
    });
  } catch (error) {


    process.exit(1);
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState !== 1) {

      return false;
    }
    await mongoose.connection.db.admin().ping();

    return true;
  } catch (error) {

    return false;
  }
};

// Get database stats
export const getDBStats = async () => {
  try {
    if (!mongoose.connection.db) {
      return null;
    }
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
    };
  } catch (error) {

    return null;
  }
};

export default connectDB;
