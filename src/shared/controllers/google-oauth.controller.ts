import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/appError';
import { getGoogleAuthURL, validateOAuthConfig } from '../config/passport';
import { EmailNotificationService } from '../services/email/email-notification.service';
import User from '../models/core/User';
import { AuthService } from '../services/auth.service';

// Helper functions for Google OAuth operations
async function revokeGoogleTokens(userId: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user?.socialAccounts?.google) {
      return false;
    }

    const accessToken = user.socialAccounts.google.accessToken;
    
    // Revoke token with Google
    if (accessToken) {
      const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        console.warn('Failed to revoke Google token:', response.statusText);
      }
    }

    // Remove Google account from user
    user.socialAccounts.google = undefined;
    await user.save();

    return true;
  } catch (error) {
    console.error('Error revoking Google tokens:', error);
    return false;
  }
}

async function getGoogleProfile(userId: string): Promise<any | null> {
  try {
    const user = await User.findById(userId);
    if (!user?.socialAccounts?.google?.accessToken) {
      return null;
    }

    const accessToken = user.socialAccounts.google.accessToken;
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      // Try to refresh token and retry
      const newToken = await refreshGoogleToken(userId);
      if (newToken) {
        const retryResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${newToken}`
          }
        });
        return retryResponse.ok ? await retryResponse.json() : null;
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Google profile:', error);
    return null;
  }
}

async function refreshGoogleToken(userId: string): Promise<string | null> {
  try {
    const user = await User.findById(userId);
    if (!user?.socialAccounts?.google?.refreshToken) {
      return null;
    }

    const refreshToken = user.socialAccounts.google.refreshToken;
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google token');
    }

    const data = await response.json() as { access_token: string };
    
    // Update access token
    user.socialAccounts.google.accessToken = data.access_token;
    user.socialAccounts.google.lastLogin = new Date();
    await user.save();

    return data.access_token as string;
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
}

export interface GoogleOAuthRequest extends Request {
  user?: any;
}

/**
 * Initiate Google OAuth login
 */
export const initiateGoogleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { returnUrl, userType, redirect } = req.query as { [key: string]: string };
  
  const configValidation = validateOAuthConfig();
  if (!configValidation.isValid) {
    throw new AppError(
      `OAuth configuration missing: ${configValidation.missingVars.join(', ')}`, 
      500
    );
  }

  // Encode returnUrl and userType inside state; avoid using server-side session
  const state = Buffer.from(JSON.stringify({
    timestamp: Date.now(),
    userType: userType || 'student',
    returnUrl: returnUrl || process.env.FRONTEND_URL
  })).toString('base64');

  const authUrl = getGoogleAuthURL(state);

  // If browser navigates directly or redirect=true is provided, send 302 redirect
  const accept = (req.get('Accept') || '').toLowerCase();
  const wantsRedirect = redirect === 'true' || accept.includes('text/html');
  if (wantsRedirect) {
    return res.redirect(authUrl);
  }

  // Default: API returns JSON for XHR/fetch consumers
  res.json({
    success: true,
    data: {
      authUrl,
      message: 'Redirect to this URL to continue with Google authentication'
    }
  });
});

/**
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      console.error('Google OAuth Error:', err);
      return redirectWithError(res, req, 'Authentication failed');
    }

    if (!user) {
      console.error('Google OAuth - No user returned:', info);
      return redirectWithError(res, req, 'Authentication failed - no user data');
    }

    handleSuccessfulAuth(req, res, user);
  })(req, res, next);
};

/**
 * Handle successful Google authentication
 */
async function handleSuccessfulAuth(req: Request, res: Response, user: any) {
  try {
    const { state } = req.query;
    let returnUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let userType = 'student';

    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        returnUrl = stateData.returnUrl || returnUrl;
        userType = stateData.userType || userType;
      } catch (e) {
        console.warn('Failed to parse OAuth state:', e);
      }
    }

    if (userType && userType !== 'student' && !user.roles.includes(userType)) {
      user.roles.push(userType);
      await user.save();
    }

    const accessToken = AuthService.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });
    const refreshToken = AuthService.generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
    });
    await (AuthService as any).whitelistRefreshToken(user, refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const urlParams = new URLSearchParams({
      success: 'true',
      token: accessToken,
      refresh_token: refreshToken,
      user_id: user._id.toString(),
      auth_provider: 'google'
    });

    const finalRedirectUrl = `${returnUrl}?${urlParams.toString()}`;
    res.redirect(finalRedirectUrl);
  } catch (error) {
    console.error('Error in handleSuccessfulAuth:', error);
    redirectWithError(res, req, 'Authentication completed but failed to process user data');
  }
}

/**
 * Redirect with error (no session dependency)
 */
function redirectWithError(res: Response, req: Request, message: string) {
  const returnUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const errorParams = new URLSearchParams({
    error: 'oauth_error',
    message: message
  });
  res.redirect(`${returnUrl}?${errorParams.toString()}`);
}

/**
 * Link Google account to existing user
 */
export const linkGoogleAccount = asyncHandler(async (req: GoogleOAuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if user already has Google account linked
  if (user.socialAccounts?.google) {
    throw new AppError('Google account already linked to this user', 400);
  }

  // Generate state for linking without using session
  const state = Buffer.from(JSON.stringify({
    action: 'link',
    userId: userId,
    timestamp: Date.now()
  })).toString('base64');

  const authUrl = getGoogleAuthURL(state);

  res.json({
    success: true,
    data: {
      authUrl,
      message: 'Redirect to this URL to link your Google account'
    }
  });
});

/**
 * Unlink Google account
 */
export const unlinkGoogleAccount = asyncHandler(async (req: GoogleOAuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.socialAccounts?.google) {
    throw new AppError('No Google account linked to this user', 400);
  }

  // Check if user has password set (ensure they can still login)
  if (!user.password && user.authProvider === 'google') {
    throw new AppError('Cannot unlink Google account. Please set a password first.', 400);
  }

  // Revoke Google tokens
  const revoked = await revokeGoogleTokens(userId);
  
  res.json({
    success: true,
    data: {
      message: 'Google account unlinked successfully',
      tokenRevoked: revoked
    }
  });
});

/**
 * Get Google account status
 */
export const getGoogleAccountStatus = asyncHandler(async (req: GoogleOAuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const googleAccount = user.socialAccounts?.google;
  const isLinked = !!googleAccount;

  res.json({
    success: true,
    data: {
      isLinked,
      email: googleAccount?.email || null,
      linkedAt: googleAccount?.linkedAt || null,
      lastLogin: googleAccount?.lastLogin || null,
      canUnlink: !!(user.password || user.socialAccounts?.facebook || user.socialAccounts?.github)
    }
  });
});

/**
 * Refresh Google profile data
 */
export const refreshGoogleProfile = asyncHandler(async (req: GoogleOAuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.socialAccounts?.google) {
    throw new AppError('No Google account linked to this user', 400);
  }

  const profileData = await getGoogleProfile(userId);
  
  if (!profileData) {
    throw new AppError('Failed to fetch Google profile data', 500);
  }

  // Update user profile if needed
  let updated = false;
  
  if (profileData.picture && profileData.picture !== user.avatar) {
    user.avatar = profileData.picture;
    updated = true;
  }

  if (profileData.name && profileData.given_name !== user.firstName) {
    user.firstName = profileData.given_name;
    updated = true;
  }

  if (profileData.family_name && profileData.family_name !== user.lastName) {
    user.lastName = profileData.family_name;
    updated = true;
  }

  if (updated) {
    await user.save();
  }

  res.json({
    success: true,
    data: {
      profile: profileData,
      userUpdated: updated,
      message: 'Google profile data refreshed successfully'
    }
  });
});

/**
 * Get OAuth configuration status
 */
export const getOAuthConfig = asyncHandler(async (req: Request, res: Response) => {
  const configValidation = validateOAuthConfig();
  
  res.json({
    success: true,
    data: {
      googleOAuth: {
        enabled: configValidation.isValid,
        configured: configValidation.isValid,
        missingConfig: configValidation.missingVars
      },
      supportedProviders: ['google'],
      callbackUrls: {
        google: process.env.GOOGLE_CALLBACK_URL
      }
    }
  });
});

/**
 * Handle OAuth errors
 */
export const handleOAuthError = asyncHandler(async (req: Request, res: Response) => {
  const { error, error_description } = req.query;
  
  console.error('OAuth Error:', { error, error_description });
  
  // Use FRONTEND_URL directly instead of session
  const returnUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const errorParams = new URLSearchParams({
    error: error as string || 'oauth_error',
    message: error_description as string || 'Authentication failed'
  });

  res.redirect(`${returnUrl}?${errorParams.toString()}`);
});

/**
 * Mobile OAuth token exchange
 */
export const mobileTokenExchange = asyncHandler(async (req: Request, res: Response) => {
  const { code, state } = req.body;
  
  if (!code) {
    throw new AppError('Authorization code is required', 400);
  }

  // This would handle mobile OAuth flow
  // For now, return instructions for mobile implementation
  res.json({
    success: false,
    message: 'Mobile OAuth flow not yet implemented',
    instructions: {
      web: 'Use /api/auth/google for web authentication',
      mobile: 'Implement Google OAuth in mobile app and exchange tokens via this endpoint'
    }
  });
});
