import dns from 'node:dns';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { syncAgmarknetPrices } from './services/domain/marketPrices/agmarknetSync.service.js';

// Node 18+'s fetch (undici) tries IPv6 first by default. On hosts where
// outbound IPv6 is present in DNS but not actually routable (common on
// WSL2 and some cloud/container networks) that first attempt hangs for
// the full connect timeout before ever falling back to IPv4 - observed
// directly here as every geocoding.service.js call to Nominatim/Overpass
// timing out via fetch while `curl` on the same host succeeded instantly.
// Preferring IPv4 first sidesteps the hang; it's a one-line, low-risk
// default that only matters for this process's own outbound HTTP calls.
dns.setDefaultResultOrder('ipv4first');

let server;
let shuttingDown = false;
let priceSyncTimer;

const PRICE_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily

// Runs once at boot and then every 24h for as long as this process
// stays up - deliberately not awaited from start() (a slow/unreachable
// data.gov.in must never delay this server accepting requests) and
// deliberately never lets a failed run crash the process: a farmer
// still needs market-price screens to work even on a day Agmarknet is
// down, just with whatever the last successful sync (or the original
// seed data) left behind.
function schedulePriceSync() {
  syncAgmarknetPrices().catch((err) => logger.warn({ err }, 'Agmarknet price sync run failed'));
  priceSyncTimer = setInterval(() => {
    syncAgmarknetPrices().catch((err) => logger.warn({ err }, 'Agmarknet price sync run failed'));
  }, PRICE_SYNC_INTERVAL_MS);
  priceSyncTimer.unref?.(); // never the reason this process stays alive
}

async function start() {
  try {
    await connectDatabase();
    server = app.listen(env.port, () => {
      console.log(`[server] Annadata backend listening on port ${env.port} (${env.nodeEnv})`);
    });
    schedulePriceSync();
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
}

// Shared by SIGTERM/SIGINT (an expected, deliberate stop - a deploy, a
// restart, Ctrl+C) and by the uncaughtException/unhandledRejection
// handlers below (an unexpected failure) - same clean sequence either
// way: stop accepting new connections, let in-flight requests finish,
// close MongoDB properly, then exit. Guarded against running twice if
// two signals arrive close together (some process managers send both
// SIGTERM and SIGINT during a single stop).
async function gracefulShutdown(reason, exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ reason }, 'Shutting down');

  if (priceSyncTimer) clearInterval(priceSyncTimer);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();

  logger.info({ reason, exitCode }, 'Shutdown complete');
  process.exit(exitCode);
}

// Expected, deliberate stops - clean exit (0).
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));

// An uncaught exception means the process's in-memory state can no
// longer be trusted - continuing to serve requests risks acting on
// corrupted state or crashing unpredictably mid-request. Log first
// (server-side only, same "never leak internals" principle as the
// HTTP error handler in app.js), then shut down cleanly rather than
// let the process hang in a broken state or die instantly without
// closing MongoDB. Abnormal exit (1) - signals to any process manager
// that this was a real failure, not a deliberate stop.
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception - shutting down');
  gracefulShutdown('uncaughtException', 1);
});

// Node's own guidance treats every unhandled rejection as a potential
// uncaught exception - there's no reliable, generic way for a
// process-level handler to know whether a given rejection left
// application state in a safe-to-continue condition or not. Rather
// than build a fragile heuristic for something that fundamentally
// can't be classified safely, this takes the same conservative path
// as uncaughtException: assume state cannot be trusted, log, shut
// down cleanly.
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection - shutting down');
  gracefulShutdown('unhandledRejection', 1);
});

start();
