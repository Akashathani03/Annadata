const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Converts lat/lng into a farmer-friendly Village/Taluk/District/State
// breakdown. Returns null on failure so the caller can fall back
// gracefully (never shows raw coordinates as a location).
//
// OSM/Nominatim doesn't tag Indian admin levels perfectly consistently,
// so this uses a best-effort mapping:
//   village  -> village | hamlet | suburb | town | city
//   taluk    -> county (when distinct from district) | subdistrict
//   district -> state_district | county
//   state    -> state
export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
    'accept-language': 'en',
  });

  try {
    const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address;
    if (!a) return null;

    const district = a.state_district || a.county || '';
    const taluk = a.county && a.county !== district ? a.county : (a.subdistrict || a.city_district || '');
    const village = a.village || a.hamlet || a.suburb || a.town || a.city || '';
    const state = a.state || '';

    return { village, taluk, district, state };
  } catch {
    return null;
  }
}

async function searchOnce(query) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    limit: '1',
    countrycodes: 'in',
  });

  const res = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const match = data?.[0];
  if (!match?.lat || !match?.lon) return null;

  const lat = Number(match.lat);
  const lng = Number(match.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

// Converts a saved text address into approximate coordinates - the
// reverse of reverseGeocode above. Only ever used as a fallback tier
// when neither live GPS nor previously-saved GPS coordinates exist;
// never overrides either. Requires at least district+state, since a
// bare village name is too ambiguous to search meaningfully on its
// own across India - returns null rather than guessing.
//
// Tries the full address first, then backs off to broader
// combinations (taluk+district+state, then just district+state) until
// one resolves. A small hamlet is very often simply absent from
// Nominatim's index (confirmed: "alakhanur, raibag, belagavi" returns
// zero results, while "raibag, belagavi" alone resolves cleanly) - a
// single all-or-nothing query would treat that as "no location" and
// let a stale/wrong fallback (e.g. an old saved lat/lng from a
// different city) win instead. Each broader query is a real farmer
// benefit, not guesswork: taluk-level placement is still far more
// useful than falling through to a default hundreds of km away.
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

    try {
      const result = await searchOnce(query);
      if (result) return result;
    } catch {
      // Try the next, broader query rather than giving up entirely.
    }
  }

  return null;
}

// In-memory only (cleared on reload) - avoids re-querying Nominatim/
// Overpass every time the same taluk's village picker is reopened in
// a session.
const villageSuggestionCache = new Map();

// Suggests villages for a taluk by resolving its approximate extent
// via Nominatim, then asking Overpass for OSM place=village|hamlet
// nodes inside that extent. This is genuine map data, not a bundled
// hand-typed list - but OSM's rural-India tagging coverage is
// inconsistent, so many taluks will return few or zero results.
// Callers must always let the farmer type their own village too.
export async function getVillageSuggestions({ taluk, district, state }) {
  if (!taluk || !district || !state) return [];

  const cacheKey = `${state}|${district}|${taluk}`.toLowerCase();
  if (villageSuggestionCache.has(cacheKey)) {
    return villageSuggestionCache.get(cacheKey);
  }

  try {
    const searchParams = new URLSearchParams({
      format: 'jsonv2',
      q: [taluk, district, state, 'India'].filter(Boolean).join(', '),
      limit: '1',
    });

    const searchRes = await fetch(`${NOMINATIM_SEARCH_URL}?${searchParams.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const bbox = searchData?.[0]?.boundingbox;
    if (!Array.isArray(bbox) || bbox.length !== 4) return [];

    const [south, north, west, east] = bbox.map(Number);
    if ([south, north, west, east].some(Number.isNaN)) return [];

    const query =
      `[out:json][timeout:20];` +
      `node["place"~"^(village|hamlet)$"](${south},${west},${north},${east});` +
      `out body 80;`;

    const overpassRes = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!overpassRes.ok) return [];

    const overpassData = await overpassRes.json();
    const names = [
      ...new Set(
        (overpassData.elements || [])
          .map((el) => el.tags?.name)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));

    villageSuggestionCache.set(cacheKey, names);
    return names;
  } catch {
    return [];
  }
}
