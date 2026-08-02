import { Router } from 'express';
import { getCurrentWeather } from '../controllers/weather.controller.js';

// No requireAuth - Home.jsx (weather's only real consumer) has no
// auth guard at all, so this preserves that existing unauthenticated
// behavior exactly, same reasoning as the Market Prices routes.
const router = Router();

router.get('/current', getCurrentWeather);

export default router;
