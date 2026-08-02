import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.middleware.js';
import healthRoutes from './routes/health.routes.js';
import whoamiRoutes from './routes/whoami.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import marketPricesRoutes from './routes/marketPrices.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import agroAIMessageRoutes from './routes/agroAI/message.routes.js';

const app = express();

// Restricted to the configured frontend origin rather than a wide-open
// cors() with no options - the latter would allow any site to call
// this API. env.corsOrigin is one value for now (single frontend
// origin per environment); a multi-origin comma-separated list is a
// trivial extension later if ever needed, not a redesign.
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/market-prices', marketPricesRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/agro-ai', agroAIMessageRoutes);

// Must be mounted after every route: an unmatched path falls through
// to notFoundHandler, which hands a well-formed ApiError to
// errorHandler - the same path any other thrown/passed error takes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
