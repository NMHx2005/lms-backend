import { Request } from 'express';
import 'express-session';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    oauth?: {
      state?: string;
      returnUrl?: string;
      provider?: string;
      timestamp?: number;
    };
    linkAccount?: {
      userId: string;
      provider: string;
      timestamp: number;
    };
  }
}

export {};
