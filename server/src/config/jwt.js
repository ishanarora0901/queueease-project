import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'queueease_jwt_secret_key_super_secure_2026_dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'queueease_jwt_refresh_secret_key_super_secure_2026_dev';

export const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

