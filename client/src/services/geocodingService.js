import { apiRequest } from './apiClient';

// Thin client for the backend's /geocoding proxy (server/src/services/
// domain/geocoding/geocoding.service.js). Previously this file called
// Nominatim/Overpass directly from the browser; that moved server-side so
// requests get a proper User-Agent (required by Nominatim's usage policy
// but not settable from browser fetch()), a shared outbound throttle
// against their ~1 req/sec public-instance limit, and a server-side cache
// so repeat lookups don't each cost a fresh upstream call. Exported
// function names/signatures are unchanged - no caller needs to change.

// Converts lat/lng into a farmer-friendly Village/Taluk/District/State
// breakdown. Returns null on failure so the caller can fall back
// gracefully (never shows raw coordinates as a location).
export async function reverseGeocode(lat, lng) {
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    const { address } = await apiRequest(`/geocoding/reverse?${params.toString()}`);
    return address;
  } catch {
    return null;
  }
}

// Converts a saved text address into approximate coordinates - the
// reverse of reverseGeocode above. Only ever used as a fallback tier
// when neither live GPS nor previously-saved GPS coordinates exist.
export async function forwardGeocode({ village, taluk, district, state }) {
  if (!district || !state) return null;

  try {
    const params = new URLSearchParams();
    if (village) params.set('village', village);
    if (taluk) params.set('taluk', taluk);
    params.set('district', district);
    params.set('state', state);
    const { location } = await apiRequest(`/geocoding/forward?${params.toString()}`);
    return location;
  } catch {
    return null;
  }
}

// In-memory only (cleared on reload) - avoids re-hitting even our own
// backend every time the same taluk's village picker is reopened in a
// session. The backend has its own longer-lived cache behind this one.
const villageSuggestionCache = new Map();

// Suggests villages for a taluk (see backend service for how - genuine
// OSM data, not a bundled hand-typed list). Coverage is inconsistent, so
// callers must always let the farmer type their own village too.
export async function getVillageSuggestions({ taluk, district, state }) {
  if (!taluk || !district || !state) return [];

  const cacheKey = `${state}|${district}|${taluk}`.toLowerCase();
  if (villageSuggestionCache.has(cacheKey)) {
    return villageSuggestionCache.get(cacheKey);
  }

  try {
    const params = new URLSearchParams({ taluk, district, state });
    const { villages } = await apiRequest(`/geocoding/villages?${params.toString()}`);
    const names = Array.isArray(villages) ? villages : [];
    villageSuggestionCache.set(cacheKey, names);
    return names;
  } catch {
    return [];
  }
}
