import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
}

export const generateTokens = (userId: string) => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET is not defined');
  }
  if (!process.env.JWT_EXPIRES_IN || !process.env.REFRESH_TOKEN_EXPIRES_IN) {
    throw new Error(
      'JWT_EXPIRES_IN or REFRESH_TOKEN_EXPIRES_IN is not defined'
    );
  }

  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as JwtPayload;
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
