import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../../shared/utils/errors';

// Simple in-memory store for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
export const rateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get current request count for this client
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // First request or window expired, start new window
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      // Increment request count
      clientData.count++;
      
      if (clientData.count > maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
        
        res.setHeader('Retry-After', retryAfter);
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
        
        return next(new RateLimitError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`));
      }
      
      // Update headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - clientData.count);
      res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
    }
    
    next();
  };
};

// Stricter rate limiting for authentication endpoints
export const authRateLimit = rateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes

// Moderate rate limiting for general API endpoints
export const apiRateLimit = rateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes

// Loose rate limiting for public endpoints
export const publicRateLimit = rateLimit(15 * 60 * 1000, 1000); // 1000 requests per 15 minutes

// Clean up expired rate limit data periodically
setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(clientId);
    }
  }
}, 60 * 1000); // Clean up every minute

// Export the main rate limiting function
export default rateLimit;
