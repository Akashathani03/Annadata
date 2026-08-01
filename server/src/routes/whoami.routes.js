import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { whoami } from '../controllers/whoami.controller.js';

const router = Router();

router.get('/whoami', requireAuth, whoami);

export default router;
