import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User, { IUser } from '../models/core/User';
import { generateJWT, generateRefreshToken } from '../utils/jwt';

// Google OAuth2 Configuration
const GOOGLE_CONFIG = {
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  scope: ['profile', 'email']
};

export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    verified: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
  provider: 'google';
  _raw: string;
  _json: any;
}

export interface OAuthUserData {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
  provider: 'google';
  providerData: any;
}

/**
 * Initialize Google OAuth Strategy
 */
function initializeGoogleStrategy(): void {
  if (!GOOGLE_CONFIG.clientID || !GOOGLE_CONFIG.clientSecret) {
    console.warn('Google OAuth not configured - missing credentials');
    return;
  }

  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CONFIG.clientID,
      clientSecret: GOOGLE_CONFIG.clientSecret,
      callbackURL: GOOGLE_CONFIG.callbackURL,
      passReqToCallback: true
    },
    async (req: any, accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
      try {
        console.log('Google OAuth Profile:', profile);

        // Extract user data from Google profile
        const userData = extractUserData(profile, accessToken, refreshToken);

        // Find or create user
        const user = await findOrCreateUser(userData);

        // Generate JWT tokens
        const tokens = await generateTokens(user);

        // Attach tokens to user object for response
        (user as any).tokens = tokens;

        done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, false);
      }
    }
  ));

  console.log('Google OAuth strategy initialized');
}

/**
 * Extract user data from Google profile
 */
function extractUserData(
  profile: any, 
  accessToken: string, 
  refreshToken: string
): OAuthUserData {
  const email = profile.emails?.[0]?.value || '';
  const firstName = profile.name?.givenName || '';
  const lastName = profile.name?.familyName || '';
  const avatar = profile.photos?.[0]?.value || '';

  return {
    googleId: profile.id,
    email,
    firstName,
    lastName,
    avatar,
    isEmailVerified: profile.emails?.[0]?.verified || false,
    provider: 'google',
    providerData: {
      accessToken,
      refreshToken,
      profile: profile._json,
      lastLogin: new Date()
    }
  };
}

/**
 * Find existing user or create new one
 */
async function findOrCreateUser(userData: OAuthUserData): Promise<IUser> {
  try {
    // First, try to find user by Google ID
    let user = await User.findOne({ 
      'socialAccounts.google.id': userData.googleId 
    });

    if (user) {
      // Update existing Google user
      return await updateExistingGoogleUser(user, userData);
    }

    // If not found by Google ID, try to find by email
    user = await User.findOne({ email: userData.email });

    if (user) {
      // Link Google account to existing user
      return await linkGoogleToExistingUser(user, userData);
    }

    // Create new user with Google account
    return await createNewGoogleUser(userData);

  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
}

/**
 * Update existing Google user
 */
async function updateExistingGoogleUser(user: IUser, userData: OAuthUserData): Promise<IUser> {
  // Update Google account data
  const googleAccount = user.socialAccounts?.google;
  if (googleAccount) {
    googleAccount.accessToken = userData.providerData.accessToken;
    googleAccount.refreshToken = userData.providerData.refreshToken;
    googleAccount.lastLogin = new Date();
    googleAccount.profile = userData.providerData.profile;
  }

  // Update basic info if needed
  if (!user.avatar && userData.avatar) {
    user.avatar = userData.avatar;
  }

  // Update email verification status
  if (userData.isEmailVerified && !user.isEmailVerified) {
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
  }

  // Update last login
  user.lastLoginAt = new Date();
  user.loginAttempts = 0; // Reset failed attempts
  user.accountLockedUntil = undefined;

  await user.save();
  return user;
}

/**
 * Link Google account to existing user
 */
async function linkGoogleToExistingUser(user: IUser, userData: OAuthUserData): Promise<IUser> {
  // Initialize socialAccounts if not exists
  if (!user.socialAccounts) {
    user.socialAccounts = {
      google: undefined,
      facebook: undefined,
      github: undefined
    };
  }

  // Add Google account data
  user.socialAccounts.google = {
    id: userData.googleId,
    email: userData.email,
    accessToken: userData.providerData.accessToken,
    refreshToken: userData.providerData.refreshToken,
    profile: userData.providerData.profile,
    linkedAt: new Date(),
    lastLogin: new Date()
  };

  // Update avatar if user doesn't have one
  if (!user.avatar && userData.avatar) {
    user.avatar = userData.avatar;
  }

  // Update email verification
  if (userData.isEmailVerified && !user.isEmailVerified) {
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
  }

  // Update last login
  user.lastLoginAt = new Date();
  user.loginAttempts = 0;
  user.accountLockedUntil = undefined;

  await user.save();
  return user;
}

/**
 * Create new user with Google account
 */
async function createNewGoogleUser(userData: OAuthUserData): Promise<IUser> {
  const newUser = new User({
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    avatar: userData.avatar,
    isEmailVerified: userData.isEmailVerified,
    emailVerifiedAt: userData.isEmailVerified ? new Date() : undefined,
    authProvider: 'google',
    socialAccounts: {
      google: {
        id: userData.googleId,
        email: userData.email,
        accessToken: userData.providerData.accessToken,
        refreshToken: userData.providerData.refreshToken,
        profile: userData.providerData.profile,
        linkedAt: new Date(),
        lastLogin: new Date()
      }
    },
    roles: ['student'], // Default role
    isActive: true,
    lastLoginAt: new Date(),
    registrationMethod: 'google_oauth',
    // Set a random password (user won't use it)
    password: generateRandomPassword(),
    accountSettings: {
      twoFactorEnabled: false,
      emailNotifications: true,
      marketingEmails: true,
      smsNotifications: false
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      theme: 'light'
    }
  });

  await newUser.save();
  return newUser;
}

/**
 * Generate JWT tokens for user
 */
async function generateTokens(user: IUser): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const payload = {
    userId: user._id,
    email: user.email,
    roles: user.roles,
    authProvider: 'google'
  };

  const accessTokenResult = generateJWT(payload, '1h');
  const refreshTokenResult = generateRefreshToken(user._id, '30d');

  // Save refresh token to user
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({
    token: refreshTokenResult.token,
    createdAt: new Date(),
    expiresAt: refreshTokenResult.expiresAt,
    userAgent: 'Google OAuth',
    ipAddress: '0.0.0.0'
  });

  // Keep only last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  return {
    accessToken: accessTokenResult.token,
    refreshToken: refreshTokenResult.token,
    expiresIn: accessTokenResult.expiresIn
  };
}

/**
 * Generate random password for OAuth users
 */
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Serialize user for session
 */
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Initialize all Passport strategies
 */
export function initializePassport(): void {
  initializeGoogleStrategy();
  
  console.log('Passport authentication initialized');
}

/**
 * Get Google OAuth URL for frontend
 */
export function getGoogleAuthURL(state?: string): string {
  const baseURL = 'https://accounts.google.com/o/oauth2/auth';
  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.clientID,
    redirect_uri: GOOGLE_CONFIG.callbackURL,
    scope: GOOGLE_CONFIG.scope.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state })
  });

  return `${baseURL}?${params.toString()}`;
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}
