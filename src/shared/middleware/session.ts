import session from 'express-session';
import MongoStore from 'connect-mongo';

export interface SessionConfig {
  secret: string;
  resave: boolean;
  saveUninitialized: boolean;
  cookie: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite: boolean | 'lax' | 'strict' | 'none';
  };
  store?: any;
  name?: string;
}

export function createSessionMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI;

  const sessionConfig: SessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'strict' : 'lax'
    },
    name: 'lms-session'
  };

  // Use MongoDB store if available
  if (mongoUri) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: mongoUri,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60, // 24 hours in seconds
      autoRemove: 'native',
      crypto: {
        secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
      }
    });
  }

  return session(sessionConfig);
}

export function createOAuthSessionMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI;

  const sessionConfig: SessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes for OAuth
      sameSite: isProduction ? 'lax' : 'lax' // Lax for OAuth redirects
    },
    name: 'lms-oauth-session'
  };

  // Use MongoDB store if available
  if (mongoUri) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: mongoUri,
      collectionName: 'oauth_sessions',
      ttl: 10 * 60, // 10 minutes in seconds
      autoRemove: 'native',
      crypto: {
        secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
      }
    });
  }

  return session(sessionConfig);
}
