import * as buyerLocationRepository from '../repositories/buyerLocationRepository';
import { DEFAULT_LOCATION } from '../config/constants';

// If the buyer/farmer has explicitly set a location via the Change
// Location sheet, that always wins (explicit choice). Otherwise, a
// logged-in user's own onboarded GPS location (captured during Login)
// is reused here instead of falling straight to the anonymous default -
// that location was captured and confirmed for exactly this purpose.
export async function getBuyerLocation({ authenticatedUser } = {}) {
  const loc = await buyerLocationRepository.find();
  if (loc.lat != null && loc.lng != null) {
    return { ...loc, label: loc.label || DEFAULT_LOCATION.label };
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
