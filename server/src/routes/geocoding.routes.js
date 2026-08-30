import { Router } from 'express';
import {
  getReverseGeocode,
  getForwardGeocode,
  getVillageSuggestions,
} from '../controllers/geocoding.controller.js';

// No requireAuth - every current caller (location capture, listing
// forms, shop setup) runs during onboarding/editing flows that aren't
// gated behind login either. Covered by the GENERAL_API backstop
// mounted ahead of this in app.js.
const router = Router();

router.get('/reverse', getReverseGeocode);
router.get('/forward', getForwardGeocode);
router.get('/villages', getVillageSuggestions);

export default router;
