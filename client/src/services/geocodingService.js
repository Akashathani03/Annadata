const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

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
