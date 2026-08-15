import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';
import { getMe, updateMe } from '../controllers/user.controller.js';

// Local to this route file, matching the same convention already
// established in shops.routes.js and listings.routes.js.
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_SIZE_BYTES } });

const router = Router();

router.get('/me', requireAuth, getMe);
router.patch('/me', requireAuth, rateLimit('PROFILE_UPDATE'), upload.single('photo'), updateMe);

export default router;
