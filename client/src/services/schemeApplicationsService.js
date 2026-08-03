import { apiRequest } from './apiClient';
import { getStoredToken } from '../repositories/sessionRepository';

// Step 10: internals now call the real Government Schemes domain
// service (backend). Function names/signatures unchanged - Schemes.jsx
// needs no changes.
//
// Applications are inherently personal, so the backend requires auth
// for both of these - but Schemes.jsx itself has no auth guard and
// calls getMyApplications() unconditionally on every load, including
// for guests. Rather than let that 401 on every guest page load, both
// functions check for a token first and degrade gracefully (empty
// list / null) exactly the way "no applications yet" already renders,
// with zero backend call and zero error for a guest just browsing.

function normalizeApplication(app) {
  if (!app) return null;
  const { _id, __v, ...rest } = app;
  return { id: _id, ...rest };
}

export async function getMyApplications() {
  const token = await getStoredToken();
  if (!token) return [];

  const { applications } = await apiRequest('/schemes/applications/me');
  return applications.map(normalizeApplication);
}

// Matches the mock's exact addAppliedTracker() behavior: applying to a
// scheme you've already applied to is a no-op (returns the existing
// entry). For a guest (no token), returns null - Schemes.jsx already
// opens the official government site regardless of this call's
// outcome, so a guest can still "apply" in the sense that matters;
// only the personal tracking entry requires being logged in.
export async function applyToScheme(schemeId) {
  const token = await getStoredToken();
  if (!token) return null;

  const { application } = await apiRequest(`/schemes/${schemeId}/apply`, { method: 'POST' });
  return normalizeApplication(application);
}
