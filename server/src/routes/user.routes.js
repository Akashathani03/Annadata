import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';
import { getMe, updateMe } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, rateLimit('PROFILE_UPDATE'), updateMe);

export default router;
