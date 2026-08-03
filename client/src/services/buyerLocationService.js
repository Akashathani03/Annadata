import * as buyerLocationRepository from '../repositories/buyerLocationRepository';
import { DEFAULT_LOCATION } from '../config/constants';

// If the buyer/farmer has explicitly set a location via the Change
// Location sheet, that always wins (explicit choice) - even over live
// GPS. Otherwise, live GPS captured this session (if granted) is used
// next, then a logged-in user's own onboarded location (captured
// during Login), then the anonymous default. liveLocation is optional
// and additive - existing callers passing only authenticatedUser
// behave exactly as before.
export async function getBuyerLocation({ authenticatedUser, liveLocation } = {}) {
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
