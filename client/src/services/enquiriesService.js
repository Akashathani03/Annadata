import * as enquiriesRepository from '../repositories/enquiriesRepository';
import * as listingsRepository from '../repositories/listingsRepository';

// category is optional and cross-references each enquiry's listing
// (enquiries themselves don't store a category - this keeps the
// schema unchanged while still letting Sell Animals/Sell Crop each
// see only their own enquiries, since both write to the same store).
export async function getEnquiries({ ownerId, listingId, status, category } = {}) {
  const results = await enquiriesRepository.findAll({ ownerId, listingId, status });
  if (!category) return results;

  const listings = await Promise.all(results.map((e) => listingsRepository.findById(e.listingId)));
  return results.filter((_, i) => listings[i]?.category === category);
}

export async function markEnquiryStatus(id, status) {
  return enquiriesRepository.updateStatus(id, status);
}

// Internal helper used by listingsService.createListing to match the
// prototype's demo behavior. Not exported for use by components -
// components never write to enquiries directly.
export async function addWelcomeEnquiry(listing) {
  return enquiriesRepository.insert({
    listingId: listing.id,
    ownerId: listing.ownerId,
    enquirer: 'Ravi Traders',
    message: `Interested in ${listing.quantity} ${listing.unit} ${listing.itemName}. Please call back.`,
    contactMethod: 'call',
    status: 'new',
  });
}
