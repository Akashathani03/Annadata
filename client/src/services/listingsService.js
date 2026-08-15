import { apiRequest } from './apiClient';

// Step: Marketplace Frontend Integration - internals now call the
// real Listings domain service (backend). Function names/signatures
// unchanged wherever possible, so every consumer (10 screens across
// Sell/Buy Crop and Sell/Buy Animals, plus buyCropsService/
// buyAnimalsService) needs no changes. The backend always derives
// ownerId from the auth token for writes and for "my listings" -
// ownerId here is accepted for interface compatibility (existing call
// sites already only ever pass the current user's own id) but never
// forwarded as a value the backend would need to trust.

function normalizeListing(listing) {
  if (!listing) return null;
  const { _id, __v, ...rest } = listing;
  return { id: _id ?? listing.id, ...rest };
}

// getListings previously combined "public browse" and "my listings"
// into one function via an optional ownerId - the real backend has
// two separate endpoints (GET /listings public, GET /listings/mine
// authenticated), so this branches on ownerId's presence rather than
// forwarding it as a value.
export async function getListings({ category, ownerId, status, query, page, limit } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (query) params.set('q', query);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  if (ownerId) {
    if (status) params.set('status', status);
    const { listings } = await apiRequest(`/listings/mine?${params.toString()}`);
    return listings.map(normalizeListing);
  }

  const { listings } = await apiRequest(`/listings?${params.toString()}`);
  return listings.map(normalizeListing);
}

export async function getListingById(id) {
  const { listing } = await apiRequest(`/listings/${id}`);
  return normalizeListing(listing);
}

// Purpose-specific seller lookup (per approval) - never a general
// getUserById. New function, additive - no existing caller relied on
// this before, since the mock's getUserById covered it previously.
export async function getListingSeller(id) {
  const { seller } = await apiRequest(`/listings/${id}/seller`);
  return seller;
}

// A photoUrl that's already a real URL (editing an existing listing)
// is sent through as a plain field, never re-uploaded. Only a fresh
// data URL (captured by PhotoUpload's FileReader) gets converted to a
// real file upload - same pattern as shopsService.saveShop.
async function buildListingRequestBody(payload) {
  const { ownerId, ownerType, photoUrl, ...rest } = payload;
  const isNewPhoto = typeof photoUrl === 'string' && photoUrl.startsWith('data:');

  if (!isNewPhoto) {
    return { isFormData: false, body: { ...rest, photoUrl } };
  }

  const blob = await (await fetch(photoUrl)).blob();
  const formData = new FormData();
  Object.entries(rest).forEach(([key, value]) => {
    if (value != null) formData.append(key, value);
  });
  formData.append('photo', blob, 'listing-photo.jpg');
  return { isFormData: true, body: formData };
}

export async function createListing(payload) {
  const { isFormData, body } = await buildListingRequestBody(payload);
  const { listing } = await apiRequest('/listings', { method: 'POST', body, isFormData });
  return normalizeListing(listing);
}

export async function updateListing(id, payload) {
  // Update never accepts a new file in the current UI flow (no
  // consumer re-uploads a photo on edit), but photoUrl may still be
  // present as the existing real URL - passed through as JSON.
  const { ownerId, ownerType, ...rest } = payload;
  const { listing } = await apiRequest(`/listings/${id}`, { method: 'PATCH', body: rest });
  return normalizeListing(listing);
}

export async function deleteListing(id) {
  const { deleted } = await apiRequest(`/listings/${id}`, { method: 'DELETE' });
  return deleted;
}

// The backend's PATCH /listings/:id/sold already records the sale
// atomically as part of closing the listing (Step: Marketplace
// Backend Phase 1's "derived from lifecycle" design) - no longer a
// separate recordSale call after this, unlike the old mock flow.
export async function markListingSold(id, { quantitySold, saleAmount, buyerName, buyerId } = {}) {
  const { listing } = await apiRequest(`/listings/${id}/sold`, {
    method: 'PATCH',
    body: { quantitySold, saleAmount, buyerName, buyerId },
  });
  return normalizeListing(listing);
}
