import { Router } from 'express';
import { postSendOtp, postVerifyOtp } from '../controllers/auth.controller.js';

// No requireAuth on either route - you can't already have a valid
// token before you've logged in. This is the one part of the API
// that's intentionally public.
const router = Router();

router.post('/otp/send', postSendOtp);
router.post('/otp/verify', postVerifyOtp);

export default router;
