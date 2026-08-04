import { ApiError } from '../utils/ApiError.js';
import { rateLimitProvider } from '../rateLimit/index.js';
import { RATE_LIMIT_POLICIES } from '../rateLimit/policies.js';

// One middleware factory, one policy category per call site - e.g.
// rateLimit('AI_REPLY') on the reply route, rateLimit('AUTHENTICATION')
// on the OTP routes. Never a single global limit; each route opts into
// exactly the category that matches what it actually costs/risks.
//
// Uses req.user.id when available (requireAuth must run before this on
// any protected route, same ordering convention already established
// for every other route in this backend) so a user is limited as
// themselves, not accidentally lumped in with everyone else on the
// same IP (relevant for farmers behind a shared mobile carrier NAT).
// Falls back to req.ip only when there's no authenticated user at all -
// exactly the OTP send/verify routes, which by definition run before
// any token exists.
export function rateLimit(category) {
  const policy = RATE_LIMIT_POLICIES[category];
  if (!policy) {
    throw new Error(`Unknown rate limit category: ${category}`);
  }

  return async function rateLimitMiddleware(req, res, next) {
    const key = req.user?.id ? `user:${req.user.id}:${category}` : `ip:${req.ip}:${category}`;

    const result = await rateLimitProvider.consume(key, policy);

    res.set('X-RateLimit-Limit', String(policy.maxRequests));
    res.set('X-RateLimit-Remaining', String(result.remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      return next(
        new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please wait a moment and try again.')
      );
    }

    next();
  };
}
