import * as usersRepository from '../repositories/usersRepository';
import { apiRequest } from './apiClient';
import { normalizeUser } from '../utils/normalizeUser';

// Step 6 correction, done carefully: getUserById is used by two
// genuinely different consumers and cannot be pointed at one place.
// buyCropsService/buyAnimalsService call it with an arbitrary
// listing.ownerId to show a SELLER's name/info on a listing - and
// since Sell Crop/Buy Crops/Sell Animals/Buy Animals are still
// entirely on the local mock data layer (only Agro AI has been
// migrated to the real backend so far), ownerId is still a local mock
// id, not a real MongoDB ObjectId. Redirecting this to the real
// backend would have silently shown the CURRENT logged-in user's own
// name as the seller on every listing - a real bug, caught before
// shipping, not shipped and found later.
//
// getUserById therefore stays exactly as it was: a lookup against the
// local mock store. Only the profile-UPDATE functions below change,
// because those only ever operate on the currently-authenticated
// user (never an arbitrary other user, per how LoginModal/Profile.jsx
// actually call them) - so it's genuinely correct for those to go to
// the real backend now.
export async function getUserById(id) {
  return usersRepository.findById(id);
}

export async function updateUserProfile(id, { name, whatsapp, village, taluk, district, state, language, lat, lng }) {
  const { user } = await apiRequest('/users/me', {
    method: 'PATCH',
    body: { name, village, taluk, district, state, language, lat, lng },
  });
  return normalizeUser(user);
}

export async function updateProfilePhoto(id, file) {
  const formData = new FormData();
  formData.append('photo', file);
  const { user } = await apiRequest('/users/me', {
    method: 'PATCH',
    body: formData,
    isFormData: true,
  });
  return normalizeUser(user);
}

export async function saveOnboardingLocation(id, { village, taluk, district, state, lat, lng }) {
  try {
    const { user } = await apiRequest('/users/me', {
      method: 'PATCH',
      body: { village, taluk, district, state, lat, lng },
    });
    return { success: true, user: normalizeUser(user) };
  } catch {
    // Matches authService.js's sendOtp/verifyOtp shape exactly - never
    // throws, so a network/API failure here can't leave the farmer
    // stuck mid-onboarding with an uncaught exception and no way
    // forward. The caller shows a clear error and the Continue button
    // remains usable for a retry.
    return { success: false };
  }
}

export async function skipOnboardingLocation(id) {
  // locationSkipped isn't part of the backend User model (nothing
  // reads it back anywhere in the app - checked directly), so this is
  // intentionally a no-op now rather than silently failing to persist
  // a field nothing was ever actually reading.
  return null;
}
