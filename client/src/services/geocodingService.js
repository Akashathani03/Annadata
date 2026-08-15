const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

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

// Converts a saved text address into approximate coordinates - the
// reverse of reverseGeocode above. Only ever used as a fallback tier
// when neither live GPS nor previously-saved GPS coordinates exist;
// never overrides either. Requires at least district+state, since a
// bare village name is too ambiguous to search meaningfully on its
// own across India - returns null rather than guessing.
export async function forwardGeocode({ village, taluk, district, state }) {
  if (!district || !state) return null;

  const query = [village, taluk, district, state, 'India'].filter(Boolean).join(', ');
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    limit: '1',
    countrycodes: 'in',
  });

  try {
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
  } catch {
    return null;
  }
}
