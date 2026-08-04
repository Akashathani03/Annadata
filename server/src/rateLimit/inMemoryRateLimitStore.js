// Fixed-window counter, in-memory. This is deliberately the same
// algorithm Redis's own INCR + EXPIRE pattern implements - a future
// Redis-backed provider is a direct mapping onto this same contract,
// not a redesign.
//
// key -> { count, windowStart }
const store = new Map();

export async function consume(key, { maxRequests, windowMs }) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.windowStart + windowMs };
}

// Without this, the map would grow without bound as new users/IPs
// appear over time, even though most entries become irrelevant the
// moment their window expires. A generous fixed threshold (10 minutes)
// comfortably covers every policy's window length defined in this
// project without needing to know which policy created each entry.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const PRUNE_AFTER_MS = 10 * 60 * 1000; // 10 minutes untouched

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > PRUNE_AFTER_MS) {
      store.delete(key);
    }
  }
}

const cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
// Doesn't hold the process open on its own (relevant for scripts/tests
// that import this module but don't run as a long-lived server).
cleanupTimer.unref?.();

// Exposed for tests only - not part of the provider contract other
// code should ever call.
export function _clearAllForTesting() {
  store.clear();
}
