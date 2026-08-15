import { apiRequest } from './apiClient';

// Step: Marketplace Frontend Integration - getSales now calls the
// real backend, which derives sales history from the Listing
// lifecycle itself (status:'closed' with a recorded sale), not a
// separate sales collection. Function signature unchanged -
// SalesHistory.jsx needs no changes.

function normalizeSale(listing) {
  if (!listing) return null;
  const { _id, __v, ...rest } = listing;
  return { id: _id ?? listing.id, ...rest };
}

export async function getSales({ ownerId } = {}) {
  const { sales } = await apiRequest('/listings/sales');
  return sales.map(normalizeSale);
}

// No longer called by listingsService.markListingSold (the backend
// now records a sale atomically as part of closing the listing) - left
// in place, unused, matching this project's established convention
// for now-dead code rather than deleting it.
export async function recordSale(payload) {
  throw new Error('recordSale is no longer used - the backend records a sale as part of markListingSold.');
}
