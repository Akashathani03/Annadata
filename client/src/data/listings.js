const STORAGE_KEY = 'annadata_listings_v1';

function loadListings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Shape mirrors the approved `listings` schema (base + CropListing/
// AnimalListing discriminator fields). `category` is what makes this
// store reusable across Sell Crop/Sell Animals/Equipment - nothing
// else about this file or its consumers changes for a new category.
//
// Persisted to localStorage (same pattern as users/shops) so listings
// survive a real page reload, not just the session.
export const listings = loadListings();

export function persistListings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {
    // Storage quota or unavailable - fail silently for MVP.
  }
}

let idCounter = 1;
export function nextListingId() {
  return `listing_${Date.now()}_${idCounter++}`;
}
