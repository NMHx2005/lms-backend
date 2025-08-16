// Utility function to test CORS configuration
export const testCorsConfiguration = () => {
  const corsOrigin = process.env.CORS_ORIGIN || '';
  const nodeEnv = process.env.NODE_ENV || 'development';

  console.log('🔒 CORS Configuration Test:');
  console.log('========================');
  console.log(`Environment: ${nodeEnv}`);
  console.log(`CORS_ORIGIN: ${corsOrigin || '(not set)'}`);

  if (corsOrigin) {
    const origins = corsOrigin
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    console.log(`Allowed origins: ${origins.length}`);
    origins.forEach((origin, index) => {
      console.log(`  ${index + 1}. ${origin}`);
    });
  } else {
    if (nodeEnv === 'development') {
      console.log('✅ Development mode: All origins allowed');
    } else {
      console.log('❌ Production mode: CORS_ORIGIN must be set');
    }
  }

  console.log('========================');

  // Test specific origins
  const testOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://api.yourdomain.com',
  ];

  console.log('\n🧪 Testing specific origins:');
  testOrigins.forEach(origin => {
    const isAllowed = isOriginAllowed(origin);
    console.log(`${isAllowed ? '✅' : '❌'} ${origin}`);
  });
};

// Function to check if an origin is allowed (same logic as middleware)
export const isOriginAllowed = (origin: string): boolean => {
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // If no CORS_ORIGIN is set, allow all origins in development
  if (allowedOrigins.length === 0) {
    return process.env.NODE_ENV === 'development';
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check for wildcard subdomains (e.g., *.example.com)
  const isWildcardMatch = allowedOrigins.some(allowed => {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return false;
  });

  return isWildcardMatch;
};

// Function to get CORS configuration summary
export const getCorsSummary = () => {
  const corsOrigin = process.env.CORS_ORIGIN || '';
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    environment: nodeEnv,
    corsOrigin: corsOrigin,
    allowedOrigins: corsOrigin
      ? corsOrigin
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [],
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    allowsAllOrigins: !corsOrigin && nodeEnv === 'development',
  };
};
