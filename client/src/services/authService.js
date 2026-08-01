import { apiRequest } from './apiClient';
import * as sessionRepository from '../repositories/sessionRepository';
import { normalizeUser } from '../utils/normalizeUser';

// Real backend calls now (Step 6), reusing the JWT flow issued by
// Step 5.5. OTP verification is still mocked server-side (matching
// the same 4821 value this app has always used) - that hasn't
// changed, only where the check and token issuance actually happen.

export async function sendOtp(phone) {
  try {
    await apiRequest('/auth/otp/send', { method: 'POST', body: { phone } });
    return { success: true };
  } catch {
    // Previously this threw uncaught on any network failure - with no
    // try/catch in LoginModal's handleSendOtp, that silently killed
    // the function before setStep('otp') ever ran: the button stayed
    // stuck disabled, no error shown, no transition - exactly the
    // "stops after Send OTP" symptom. Matches verifyOtp's existing
    // defensive shape instead of being the one inconsistent function.
    return { success: false };
  }
}

export async function verifyOtp(phone, otp) {
  try {
    const { token, user, isNewUser } = await apiRequest('/auth/otp/verify', {
      method: 'POST',
      body: { phone, otp },
    });
    await sessionRepository.setSession({ token });
    return { success: true, user: normalizeUser(user), isNewUser };
  } catch {
    // Matches the old mock behavior's shape exactly (a plain
    // { success:false }, not a thrown error) - LoginModal's existing
    // OTP-step logic already handles this shape, so it needs no
    // changes.
    return { success: false };
  }
}

export async function getCurrentSession() {
  const token = await sessionRepository.getStoredToken();
  if (!token) return null;

  try {
    const { user } = await apiRequest('/users/me');
    return normalizeUser(user);
  } catch {
    // Invalid/expired token - clear it so the app doesn't keep trying
    // to use a token that will never work, same self-healing behavior
    // the old mock getCurrentSession had for a dangling userId.
    await sessionRepository.clearSession();
    return null;
  }
}

export async function logout() {
  await sessionRepository.clearSession();
}
