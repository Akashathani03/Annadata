import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';

// Server-side proxy for Nominatim/Overpass (OpenStreetMap's free geocoding
// services). Moved here from the client (which called these directly from
// the browser) for three reasons:
//   1. Nominatim's usage policy requires a real identifying User-Agent -
//      browsers won't let client-side fetch() set that header at all.
//   2. Their public instances share a global ~1 req/sec budget across every
//      app using them, not per-app - every farmer's browser hitting them
//      directly doesn't respect that shared ceiling in any way. Funneling
//      through this single server process lets one throttle actually mean
//      something.
//   3. A server-side cache means two farmers in the same village, or one
//      farmer nudging the map picker's pin back and forth, don't each cost
//      a fresh upstream request.
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// example.com is treated as spam/placeholder traffic and gets a flat 403
// from Nominatim (confirmed by hand: "Annadata/1.0 (dev@example.com)" is
// rejected, "Annadata/1.0" alone is not) - so the un-configured default
// must never appear inside the User-Agent, only a real configured email.
const DEFAULT_CONTACT_EMAIL = 'dev@example.com';
const USER_AGENT =
  env.geocodingContactEmail && env.geocodingContactEmail !== DEFAULT_CONTACT_EMAIL
    ? `Annadata/1.0 (${env.geocodingContactEmail})`
    : 'Annadata/1.0';

// --- Outbound throttle -----------------------------------------------
// Nominatim's and Overpass's own usage policies cap free-tier traffic at
// roughly 1 request/second, shared globally. A rejecting rate limiter
// (as used for inbound per-client limits elsewhere in this app) is the
// wrong shape here - there's no "client" to hand a 429 to, just our own
// outgoing call. Instead this serializes every outbound call per upstream
// behind a promise chain, delaying (never dropping) each one until at
// least MIN_GAP_MS has passed since the last dispatch to that upstream.
const MIN_GAP_MS = 1100;
const throttleState = new Map(); // upstream name -> { queue: Promise, nextAvailableAt: number }

function throttled(upstream, fn) {
  const state = throttleState.get(upstream) || { queue: Promise.resolve(), nextAvailableAt: 0 };

  const run = state.queue.then(async () => {
    const wait = Math.max(0, state.nextAvailableAt - Date.now());
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    state.nextAvailableAt = Date.now() + MIN_GAP_MS;
    return fn();
  });

  // Swallow rejection in the chain itself (not in the caller's awaited
  // value) so one failed call never poisons the queue for calls after it.
  state.queue = run.catch(() => {});
  throttleState.set(upstream, state);

  return run;
}

// --- Cache --------------------------------------------------------------
// key -> { value, expiresAt }. Plain in-memory Map, same shape as the
// rate-limit store's cleanup pattern - fine for a single server instance;
// a multi-instance deployment would swap this for a shared store the same
// way rateLimitProvider documents for Redis, without touching call sites.
const cache = new Map();
const REVERSE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days - addresses don't move
const FORWARD_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const VILLAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // OSM village tagging changes occasionally

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function cacheSet(key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const CACHE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiresAt) cache.delete(key);
  }
}, CACHE_CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();

// Rounded to ~11m precision (4 decimal places) - farmer GPS drift and
// repeated pin nudges within that radius should hit the same cache entry
// rather than each counting as a fresh coordinate.
function reverseCacheKey(lat, lng) {
  return `rev:${lat.toFixed(4)}:${lng.toFixed(4)}`;
}

// Throws on any non-OK response rather than returning null - callers
// rely on that to tell "upstream/network failure, don't cache it" apart
// from "upstream genuinely succeeded but found nothing", which IS safe
// to cache. Blurring the two previously caused transient failures (a
// timeout, a 429, a 503) to get cached as a 30-day-long false "no
// address here".
async function fetchJson(url, { upstream }) {
  return throttled(upstream, async () => {
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      throw new Error(`${upstream} responded ${res.status}`);
    }
    return res.json();
  });
}

// Converts lat/lng into a farmer-friendly Village/Taluk/District/State
// breakdown. Returns null on failure so the caller can fall back
// gracefully (never shows raw coordinates as a location).
export async function reverseGeocode(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const cacheKey = reverseCacheKey(lat, lng);
  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return cached;

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    'accept-language': 'en',
  });

  try {
    const data = await fetchJson(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, { upstream: 'nominatim' });
    const a = data?.address;
    let result = null;
    if (a) {
      const district = a.state_district || a.county || '';
      const taluk = a.county && a.county !== district ? a.county : (a.subdistrict || a.city_district || '');
      const village = a.village || a.hamlet || a.suburb || a.town || a.city || '';
      const state = a.state || '';
      result = { village, taluk, district, state };
    }
    // Cached even when null - that's a genuine "Nominatim resolved this
    // coordinate and found no address" (e.g. open ocean), which is a
    // stable answer worth caching, unlike a request failure below.
    cacheSet(cacheKey, result, REVERSE_TTL_MS);
    return result;
  } catch (err) {
    logger.warn({ err, lat, lng }, 'Reverse geocode request failed');
    return null; // not cached - a transient failure should be retried next time, not treated as a permanent answer
  }
}

async function searchOnce(query) {
  const params = new URLSearchParams({ format: 'jsonv2', q: query, limit: '1', countrycodes: 'in' });
  const data = await fetchJson(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, { upstream: 'nominatim' });
  const match = data?.[0];
  if (!match?.lat || !match?.lon) return null;

  const lat = Number(match.lat);
  const lng = Number(match.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

// Converts a saved text address into approximate coordinates. Tries the
// full address first, then backs off to broader combinations (taluk+
// district+state, then just district+state) until one resolves - a small
// hamlet is very often simply absent from Nominatim's index while the
// taluk it's in resolves cleanly, and taluk-level placement is still far
// more useful to a farmer than falling through to nothing.
export async function forwardGeocode({ village, taluk, district, state }) {
  if (!district || !state) return null;

  const attempts = [
    [village, taluk, district, state],
    [taluk, district, state],
    [district, state],
  ];

  const triedQueries = new Set();

  for (const parts of attempts) {
    const query = [...parts, 'India'].filter(Boolean).join(', ');
    if (triedQueries.has(query)) continue;
    triedQueries.add(query);

    const cacheKey = `fwd:${query.toLowerCase()}`;
    const cached = cacheGet(cacheKey);
    if (cached !== undefined) {
      if (cached) return cached;
      continue;
    }

    try {
      const result = await searchOnce(query);
      cacheSet(cacheKey, result, FORWARD_TTL_MS);
      if (result) return result;
    } catch (err) {
      logger.warn({ err, query }, 'Forward geocode request failed');
      // Try the next, broader query rather than giving up entirely.
    }
  }

  return null;
}

// Suggests villages for a taluk by resolving its approximate extent via
// Nominatim, then asking Overpass for OSM place=village|hamlet nodes
// inside that extent. Genuine map data, not a bundled hand-typed list -
// but OSM's rural-India tagging coverage is inconsistent, so many taluks
// will return few or zero results. Callers must always let the farmer
// type their own village too.
export async function getVillageSuggestions({ taluk, district, state }) {
  if (!taluk || !district || !state) return [];

  const cacheKey = `vil:${state}|${district}|${taluk}`.toLowerCase();
  const cached = cacheGet(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const searchParams = new URLSearchParams({
      format: 'jsonv2',
      q: [taluk, district, state, 'India'].filter(Boolean).join(', '),
      limit: '1',
    });
    const searchData = await fetchJson(`${NOMINATIM_SEARCH_URL}?${searchParams.toString()}`, { upstream: 'nominatim' });
    const bbox = searchData?.[0]?.boundingbox;

    let names = [];
    if (Array.isArray(bbox) && bbox.length === 4) {
      const [south, north, west, east] = bbox.map(Number);
      if (![south, north, west, east].some(Number.isNaN)) {
        const query =
          `[out:json][timeout:20];` +
          `node["place"~"^(village|hamlet)$"](${south},${west},${north},${east});` +
          `out body 80;`;

        const overpassData = await throttled('overpass', async () => {
          const res = await fetch(OVERPASS_URL, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': USER_AGENT,
            },
          });
          if (!res.ok) {
            throw new Error(`overpass responded ${res.status}`);
          }
          return res.json();
        });

        names = [
          ...new Set(
            (overpassData?.elements || []).map((el) => el.tags?.name).filter(Boolean)
          ),
        ].sort((a, b) => a.localeCompare(b));
      }
    }

    // Cached even when empty - a genuine "this taluk resolved but OSM
    // has no tagged villages in it" is a stable answer, unlike the
    // request-failure path below.
    cacheSet(cacheKey, names, VILLAGE_TTL_MS);
    return names;
  } catch (err) {
    logger.warn({ err, taluk, district, state }, 'Village suggestion lookup failed');
    return []; // not cached - retry next time instead of permanently hiding suggestions
  }
}
