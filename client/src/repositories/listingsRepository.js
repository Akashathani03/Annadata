import { listings, nextListingId, persistListings } from '../data/listings';

// In-memory implementation for the MVP. Every function signature here
// matches the shape of the future GET/POST/PATCH/DELETE /api/listings
// calls, so listingsService.js (business logic) never needs to change
// when this file's bodies are rewritten to call the real API.

export async function findAll({ category, ownerId, status } = {}) {
  return listings.filter((l) => {
    if (category && l.category !== category) return false;
    if (ownerId && l.ownerId !== ownerId) return false;
    if (status && l.status !== status) return false;
    return true;
  });
}

export async function findById(id) {
  return listings.find((l) => l.id === id) ?? null;
}

export async function insert(listingInput) {
  const now = Date.now();
  const listing = {
    id: nextListingId(),
    views: 0,
    createdAt: now,
    updatedAt: now,
    ...listingInput,
  };
  listings.unshift(listing);
  persistListings();
  return listing;
}

export async function update(id, patch) {
  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) return null;
  listings[index] = { ...listings[index], ...patch, updatedAt: Date.now() };
  persistListings();
  return listings[index];
}

export async function remove(id) {
  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) return false;
  listings.splice(index, 1);
  persistListings();
  return true;
}
