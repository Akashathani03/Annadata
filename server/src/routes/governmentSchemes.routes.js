import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getSchemes,
  getSchemeById,
  getMyApplications,
  applyToScheme,
} from '../controllers/governmentSchemes.controller.js';

const router = Router();

// Public - Schemes.jsx has no auth guard, browsing schemes is
// available to guests, same precedent as Market Prices/Near Shop.
router.get('/', getSchemes);

// Applications are inherently personal - always authenticated, the
// backend derives the user from the token, never a client-supplied id.
// Mounted before /:id so "applications" is never mistaken for a
// scheme id.
router.get('/applications/me', requireAuth, getMyApplications);
router.post('/:id/apply', requireAuth, applyToScheme);

router.get('/:id', getSchemeById);

export default router;
