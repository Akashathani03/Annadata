// Great-circle distance between two lat/lng points, in kilometers.
export function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(v))) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Rounds a distance to whole km for display. A distance computed from
// a geocoded taluk/district centroid (not a real GPS fix - see
// LocationContext's profileLat/profileLng) can't actually promise
// sub-kilometer accuracy, so showing one decimal place (e.g.
// "25.0 km") implies a precision the underlying location data never
// had. Whole-km is the honest amount of precision to claim; the
// distance itself is not being removed - it's still the most useful
// signal a farmer has for which market/shop/listing is genuinely
// closer, just no longer presented as more exact than it is.
export function formatDistanceKm(km) {
  if (km == null || Number.isNaN(km)) return null;
  return String(Math.round(km));
}

// Given a coordinate and a list of items each with a `.location.lat/.lng`,
// returns the item with the smallest distance, plus that distance in km.
export function findNearest(lat, lng, items, getLocation = (item) => item.location) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const item of items) {
    const loc = getLocation(item);
    if (!loc || loc.lat == null || loc.lng == null) continue;
    const d = distanceKm(lat, lng, loc.lat, loc.lng);
    if (d != null && d < nearestDistance) {
      nearestDistance = d;
      nearest = item;
    }
  }

  return nearest ? { item: nearest, distanceKm: nearestDistance } : null;
}
