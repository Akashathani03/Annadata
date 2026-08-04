import { Router } from 'express';
import { postSendOtp, postVerifyOtp } from '../controllers/auth.controller.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

// No requireAuth on either route - you can't already have a valid
// token before you've logged in. This is the one part of the API
// that's intentionally public. rateLimit('AUTHENTICATION') here is
// necessarily IP-based (req.user doesn't exist yet on either route) -
// exactly the case Step 19 calls out for unauthenticated endpoints.
const router = Router();

router.post('/otp/send', rateLimit('AUTHENTICATION'), postSendOtp);
router.post('/otp/verify', rateLimit('AUTHENTICATION'), postVerifyOtp);

export default router;
