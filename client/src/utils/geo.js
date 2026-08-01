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
