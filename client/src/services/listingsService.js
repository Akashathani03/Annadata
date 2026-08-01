import * as listingsRepository from '../repositories/listingsRepository';
import { addWelcomeEnquiry } from './enquiriesService';
import { recordSale } from './salesService';

// Business logic and orchestration only - all data access goes through
// listingsRepository. This file (and every component) is completely
// insulated from how/where listings are actually stored.

export async function getListings({ category, ownerId, status } = {}) {
  return listingsRepository.findAll({ category, ownerId, status });
}

export async function getListingById(id) {
  return listingsRepository.findById(id);
}

export async function createListing(payload) {
  const listing = await listingsRepository.insert({
    ownerId: payload.ownerId,
    ownerType: payload.ownerType ?? 'farmer',
    category: payload.category,
    itemId: payload.itemId,
    itemName: payload.itemName,
    quantity: payload.quantity,
    unit: payload.unit,
    price: payload.price,
    description: payload.description ?? '',
    photoUrl: payload.photoUrl ?? '',
    apmcId: payload.apmcId ?? null,
    apmcName: payload.apmcName ?? '',
    location: payload.location ?? '',
    locationVillage: payload.locationVillage ?? '',
    locationTaluk: payload.locationTaluk ?? '',
    locationDistrict: payload.locationDistrict ?? '',
    locationState: payload.locationState ?? '',
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    phone: payload.phone ?? '',
    status: payload.status,
  });

  // Matches the prototype's behavior: publishing a listing seeds one
  // demo buyer enquiry so the dashboard/enquiries screens aren't empty
  // immediately after the farmer's first publish. Business rule lives
  // here, not in the repository.
  if (listing.status === 'published') {
    await addWelcomeEnquiry(listing);
  }

  return listing;
}

export async function updateListing(id, payload) {
  return listingsRepository.update(id, payload);
}

export async function deleteListing(id) {
  return listingsRepository.remove(id);
}

// Business rule: marking a listing sold both flips its status and
// records a sale - these always happen together, so the orchestration
// lives here rather than being left to whichever component calls it.
export async function markListingSold(id, { quantitySold, saleAmount, buyerName }) {
  const listing = await listingsRepository.findById(id);
  if (!listing) return null;

  const updated = await listingsRepository.update(id, { status: 'sold' });

  await recordSale({
    listingId: listing.id,
    ownerId: listing.ownerId,
    category: listing.category,
    itemName: listing.itemName,
    quantitySold,
    unit: listing.unit,
    saleAmount,
    buyerName,
  });

  return updated;
}
