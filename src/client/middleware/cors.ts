import cors from 'cors';

// CORS configuration for different environments
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // If no CORS_ORIGIN is set, allow all origins in development
    if (allowedOrigins.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      // In production, require CORS_ORIGIN to be set
      return callback(new Error('CORS_ORIGIN must be set in production'));
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check for wildcard subdomains (e.g., *.example.com)
    const isWildcardMatch = allowedOrigins.some(allowed => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain);
      }
      return false;
    });

    if (isWildcardMatch) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'Cache-Control',
    'Pragma',
    'X-Request-ID',
    'X-Client-Version',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Request-ID',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Development CORS (more permissive)
const devCorsOptions = {
  ...corsOptions,
  origin: true, // Allow all origins in development
};

// Production CORS (strict)
const prodCorsOptions = {
  ...corsOptions,
  // origin is already configured to be strict in production
};

// Export appropriate CORS configuration based on environment
export const corsMiddleware =
  process.env.NODE_ENV === 'production'
    ? cors(prodCorsOptions)
    : cors(devCorsOptions);

// Export CORS options for reference
export { corsOptions, devCorsOptions, prodCorsOptions };
