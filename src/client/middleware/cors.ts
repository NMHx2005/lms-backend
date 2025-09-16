import cors from 'cors';

const normalize = (s?: string) => (s || '').trim().replace(/\/$/, '').toLowerCase();

const getAllowedOrigins = (): string[] => {
  // Prefer CORS_ORIGINS, fallback to CORS_ORIGIN or CORS_ORIGIN_PRODUCTION
  const raw =
    process.env.CORS_ORIGINS ||
    process.env.CORS_ORIGIN ||
    process.env.CORS_ORIGIN_PRODUCTION ||
    '';
  return raw
    .split(',')
    .map(s => normalize(s))
    .filter(Boolean);
};

// CORS configuration for different environments
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();
    const o = normalize(origin);

    // If no origins configured: allow in development, block in production
    if (allowedOrigins.length === 0) {
      return process.env.NODE_ENV === 'development'
        ? callback(null, true)
        : callback(new Error('CORS_ORIGINS must be set in production'));
    }

    // Exact match
    if (allowedOrigins.includes(o)) return callback(null, true);

    // Wildcard support like https://*.vercel.app
    const ok = allowedOrigins.some(allowed => {
      if (!allowed.includes('*')) return false;
      const pattern = '^' + allowed
        .replace(/[-/\\^$+?.()|[\]{}]/g, r => `\\${r}`)
        .replace(/\\\*/g, '[^.]+') + '$';
      try { return new RegExp(pattern).test(o); } catch { return false; }
    });
    if (ok) return callback(null, true);

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
