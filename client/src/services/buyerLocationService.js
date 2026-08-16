import * as buyerLocationRepository from '../repositories/buyerLocationRepository';
import { DEFAULT_LOCATION } from '../config/constants';

// If the buyer/farmer has explicitly set a location via the Change
// Location sheet, that always wins (explicit choice) - even over live
// GPS. Otherwise: live GPS captured this session (if granted) - a
// real, fresh fix beats everything below it. Then the location
// geocoded from their saved village/taluk/district/state text, ahead
// of their raw saved lat/lng - the same reasoning as Market Prices'
// profileLat/profileLng (see LocationContext.jsx): a farmer can see
// and correct their typed address on the Profile screen, but never
// sees the raw lat/lng, so a stale or coarse desktop/IP-based fix
// from months ago can sit there wrong indefinitely even after the
// address is fixed. Only when there's no usable address at all does
// the raw saved lat/lng get used, then the anonymous default.
// liveLocation and geocodedLocation are optional - existing callers
// passing only authenticatedUser still work, just without those two
// tiers.
export async function getBuyerLocation({ authenticatedUser, liveLocation, geocodedLocation } = {}) {
  const loc = await buyerLocationRepository.find();
  if (loc.lat != null && loc.lng != null) {
    return { ...loc, label: loc.label || DEFAULT_LOCATION.label };
  }
  if (liveLocation?.lat != null && liveLocation?.lng != null) {
    return {
      ...loc,
      lat: liveLocation.lat,
      lng: liveLocation.lng,
      label: loc.label || DEFAULT_LOCATION.label,
    };
  }
  if (geocodedLocation?.lat != null && geocodedLocation?.lng != null) {
    return {
      ...loc,
      lat: geocodedLocation.lat,
      lng: geocodedLocation.lng,
      label: loc.label || authenticatedUser?.location || DEFAULT_LOCATION.label,
    };
  }
  if (authenticatedUser?.lat != null && authenticatedUser?.lng != null) {
    return {
      ...loc,
      lat: authenticatedUser.lat,
      lng: authenticatedUser.lng,
      label: loc.label || authenticatedUser.location || DEFAULT_LOCATION.label,
    };
  }
  return { ...loc, label: loc.label || DEFAULT_LOCATION.label };
}

export async function updateBuyerLocation(patch) {
  return buyerLocationRepository.update(patch);
}
