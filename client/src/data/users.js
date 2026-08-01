const STORAGE_KEY = 'annadata_users_v1';

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// In-memory for speed, but rehydrated from and persisted to localStorage
// so a real page reload doesn't orphan a still-valid session (the
// session pointer alone surviving reload is meaningless if the user
// record it points to resets to empty). Real backend later: this file
// disappears entirely, usersRepository talks to the API/DB instead.
export const users = loadUsers();

export function persistUsers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Storage quota or unavailable - fail silently for MVP, matches
    // sessionRepository's own error handling.
  }
}

let idCounter = 1;
export function nextUserId() {
  return `user_${Date.now()}_${idCounter++}`;
}
