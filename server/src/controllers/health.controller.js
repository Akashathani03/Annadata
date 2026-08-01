import { getDatabaseState } from '../config/database.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/apiResponse.js';

// Reflects this backend's own state only, per the Security &
// Deployment architecture session: never calls out to Gemini or any
// external AI provider. A slow/unavailable AI provider should never
// make Annadata's backend report unhealthy - that's the Failed/Retry
// message state's job (already built on the frontend), not this one's.
//
// Now uses the shared sendSuccess helper (Step 2) instead of building
// the { success, data } envelope by hand - the response shape and
// behavior are identical to Step 1, only the internal plumbing
// changed, exactly as this file's own earlier comment anticipated.
export function getHealth(req, res) {
  sendSuccess(res, {
    status: 'ok',
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    database: getDatabaseState(),
  });
}
