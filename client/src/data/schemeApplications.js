const STORAGE_KEY = 'annadata_scheme_applications_v1';

// Seeded with the prototype's exact 2 demo entries. Persisted to
// localStorage from the start (same pattern as users/shops) so applying
// to a scheme survives a real page reload, not just the session.
const SEED = [
  { id: 'seed_pm-kisan', schemeId: 'pm-kisan', schemeTitle: 'PM-KISAN', status: 'In Review', submittedAt: '2026-07-12' },
  { id: 'seed_kcc', schemeId: 'kcc', schemeTitle: 'Kisan Credit Card', status: 'Approved', submittedAt: '2026-06-02' },
];

function loadApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...SEED];
  } catch {
    return [...SEED];
  }
}

export const schemeApplications = loadApplications();

export function persistSchemeApplications() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemeApplications));
  } catch {
    // Storage quota or unavailable - fail silently for MVP.
  }
}

let idCounter = 1;
export function nextApplicationId() {
  return `schemeapp_${Date.now()}_${idCounter++}`;
}
