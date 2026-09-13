import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.middleware.js';
import { rateLimit } from './middleware/rateLimit.middleware.js';
import healthRoutes from './routes/health.routes.js';
import whoamiRoutes from './routes/whoami.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import marketPricesRoutes from './routes/marketPrices.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import shopsRoutes from './routes/shops.routes.js';
import nearShopsRoutes from './routes/nearShops.routes.js';
import governmentSchemesRoutes from './routes/governmentSchemes.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import agroAIMessageRoutes from './routes/agroAI/message.routes.js';
import agroAISessionsRoutes from './routes/agroAI/sessions.routes.js';
import geocodingRoutes from './routes/geocoding.routes.js';

const app = express();

// Step 20 hardening. contentSecurityPolicy and hsts are explicitly
// disabled - both are ON by default in helmet()'s own defaults, and
// both were explicitly excluded from this step (CSP could affect the
// frontend in ways not fully audited here; HSTS shouldn't be sent
// until production runs entirely over HTTPS). crossOriginResourcePolicy
// is set to 'cross-origin' (not helmet's own default of 'same-origin')
// specifically because the frontend loads uploaded photos directly
// from this backend's /uploads path across origins
// (localhost:5173 -> localhost:8123) - helmet's default would silently
// have started blocking every crop/shop photo already working in the
// app. Every other helmet default (X-Content-Type-Options, X-Frame-
// Options, etc.) is left as-is - safe for a JSON+static-image API with
// no HTML views to protect.
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Explicit, standard hardening beyond what helmet's own hidePoweredBy
// middleware already does - redundant with it, but cheap and makes the
// intent clear without depending on reading helmet's own defaults.
app.disable('x-powered-by');

// Restricted to the configured frontend origin(s) rather than a
// wide-open cors() with no options - the latter would allow any site
// to call this API. CORS_ORIGIN accepts a comma-separated list (e.g.
// local dev + a temporary tunnel URL) so testing through a tunnel
// never requires silently dropping the normal localhost origin.
const corsOrigins = env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length > 1 ? corsOrigins : corsOrigins[0] }));

// Explicit, deliberate limits (Step 20) rather than relying on
// Express's implicit 100kb default - generous enough for any real text
// message, profile update, or form field this app sends, nowhere near
// image-sized (those go through multer's own separate, already-
// existing 8MB limit, never through these parsers at all).
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Serves whatever localFilesystemStorage.js writes to ./uploads, at
// the same /uploads prefix its saveFile() already returns as part of
// each image's url. This line is specific to the local-filesystem
// provider - a future S3/Cloud Storage swap would remove this (files
// would be served directly from the cloud provider instead) without
// any service-layer code needing to change.
app.use('/uploads', express.static('uploads'));

// Structured request logging (method, path, status, duration) for
// every request - one line per request, using the same pino instance
// every future module logs through, not console.log calls scattered
// per route.
app.use(pinoHttp({ logger }));

// Versioned from day one, per the API Architecture session - every
// future module's routes (auth, chat, market prices, etc.) mount
// under this same /api/v1 prefix.
app.use('/api/v1', healthRoutes);
app.use('/api/v1', whoamiRoutes);

// Backstop for every route mounted below this point - routes with
// their own tighter, cost/risk-specific policy (AI_REPLY,
// AUTHENTICATION, IMAGE_UPLOAD, PROFILE_UPDATE) apply that within
// their own route file, on top of this one. health/whoami above are
// deliberately exempt (diagnostic routes, not farmer-facing).
app.use('/api/v1', rateLimit('GENERAL_API'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/market-prices', marketPricesRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/shops', shopsRoutes);
app.use('/api/v1/near-shops', nearShopsRoutes);
app.use('/api/v1/schemes', governmentSchemesRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/agro-ai', agroAIMessageRoutes);
app.use('/api/v1/agro-ai', agroAISessionsRoutes);
app.use('/api/v1/geocoding', geocodingRoutes);

// Must be mounted after every route: an unmatched path falls through
// to notFoundHandler, which hands a well-formed ApiError to
// errorHandler - the same path any other thrown/passed error takes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
