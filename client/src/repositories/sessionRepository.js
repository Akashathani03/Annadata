const SESSION_KEY = 'annadata_session_v1';

// Now stores a real { token } (a real backend-issued JWT, per Step
// 5.5) instead of a plain { userId } - exactly what this file's own
// earlier comment anticipated. Callers (authService) don't change
// their own shape of interaction with this file, only what's inside
// the stored object.
export async function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Small convenience used by apiClient.js - every authenticated request
// needs just the raw token string, not the whole session object.
export async function getStoredToken() {
  const session = await getSession();
  return session?.token ?? null;
}
