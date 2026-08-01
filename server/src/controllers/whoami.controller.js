import { sendSuccess } from '../utils/apiResponse.js';

// Minimal diagnostic endpoint whose entire purpose is proving the
// auth middleware works correctly end to end - not business logic,
// not a placeholder for something else. Genuinely useful to keep
// permanently: a small, always-available way to confirm what a given
// token actually decodes to in any environment.
export function whoami(req, res) {
  sendSuccess(res, { user: req.user });
}
