import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Verifies a standard JWT signed with env.jwtSecret and attaches the
// decoded payload to req.user. Deliberately agnostic about *how* the
// token was issued - it will work correctly once a real login/OTP
// endpoint exists and starts signing tokens with this same secret,
// without this file needing to change at all.
//
// Expects the token's payload to carry a `sub` claim (the user's id),
// the standard JWT convention for "subject" - req.user.id mirrors what
// every future controller/service will read to scope a query to the
// authenticated user (e.g. Session/Message ownership checks, per the
// Database & Security sessions).
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Missing or malformed Authorization header.'));
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: decoded.sub, ...decoded };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'TOKEN_EXPIRED', 'Session expired. Please log in again.'));
    }
    return next(new ApiError(401, 'INVALID_TOKEN', 'Invalid authentication token.'));
  }
}
