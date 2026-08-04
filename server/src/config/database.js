import mongoose from 'mongoose';
import { env } from './env.js';

// Connects once at startup, before the HTTP server begins accepting
// requests - a bad DB connection should fail fast at boot (see
// server.js), not surface later as a mysterious error on first query.
export async function connectDatabase() {
  mongoose.connection.on('error', (err) => {
    console.error('[database] connection error:', err.message);
  });

  // Explicit, shorter timeout than mongoose's default - a connection
  // failure at boot should be reported quickly, not after a long
  // silent wait, so "fail fast" (see the comment above) is genuinely
  // fast in practice, not just in intent.
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`[database] connected (${env.nodeEnv})`);
}

// Step 21: used during graceful shutdown (SIGTERM/SIGINT, or an
// uncaughtException/unhandledRejection forcing a clean restart) -
// closes the connection properly rather than letting the process die
// with it still open.
export async function disconnectDatabase() {
  await mongoose.connection.close();
}

// Used by the health check (per the Security & Deployment session:
// readiness should reflect this backend's own state only).
export function getDatabaseState() {
  // mongoose readyState: 0 = disconnected, 1 = connected,
  // 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
