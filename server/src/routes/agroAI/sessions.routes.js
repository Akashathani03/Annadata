import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getSessions, patchSession, deleteSession } from '../../controllers/agroAI/sessions.controller.js';

// Session-scoped operations (Previous Chats), kept separate from
// message.routes.js's message-scoped ones - same mount prefix
// (/api/v1/agro-ai), same requireAuth + ownership-check pattern as
// every existing agro-ai route.
const router = Router();

router.get('/sessions', requireAuth, getSessions);
router.patch('/sessions/:id', requireAuth, patchSession);
router.delete('/sessions/:id', requireAuth, deleteSession);

export default router;
