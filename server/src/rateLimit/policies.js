// One place per category, easy to tune independently. Farmer-first:
// generous enough that normal usage never gets close to these limits,
// tight enough to stop a runaway or abusive client - especially
// AI_REPLY, which costs real money per request (a live Gemini call).
export const RATE_LIMIT_POLICIES = {
  AI_REPLY: { maxRequests: 20, windowMs: 60 * 1000 }, // real Gemini calls - tightest, cost-driven
  AUTHENTICATION: { maxRequests: 5, windowMs: 60 * 1000 }, // OTP send/verify - brute-force protection
  IMAGE_UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 },
  PROFILE_UPDATE: { maxRequests: 10, windowMs: 60 * 1000 },
  GENERAL_API: { maxRequests: 100, windowMs: 60 * 1000 }, // broad backstop for everything else
};
