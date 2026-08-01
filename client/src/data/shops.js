const STORAGE_KEY = 'annadata_shops_v1';

function loadShops() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Same pattern as data/users.js - in-memory for speed, persisted to
// localStorage so shop details survive a real page reload, not just
// the current session. Real backend later: this file disappears,
// shopsRepository talks to the API/DB instead.
export const shops = loadShops();

export function persistShops() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
  } catch {
    // Storage quota or unavailable - fail silently for MVP.
  }
}

let idCounter = 1;
export function nextShopId() {
  return `shop_${Date.now()}_${idCounter++}`;
}
