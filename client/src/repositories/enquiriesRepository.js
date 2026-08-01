import { enquiries, nextEnquiryId, persistEnquiries } from '../data/enquiries';

export async function findAll({ ownerId, listingId, status } = {}) {
  return enquiries.filter((e) => {
    if (ownerId && e.ownerId !== ownerId) return false;
    if (listingId && e.listingId !== listingId) return false;
    if (status && e.status !== status) return false;
    return true;
  });
}

export async function insert(enquiryInput) {
  const enquiry = {
    id: nextEnquiryId(),
    createdAt: Date.now(),
    ...enquiryInput,
  };
  enquiries.unshift(enquiry);
  persistEnquiries();
  return enquiry;
}

export async function updateStatus(id, status) {
  const index = enquiries.findIndex((e) => e.id === id);
  if (index === -1) return null;
  enquiries[index] = { ...enquiries[index], status };
  persistEnquiries();
  return enquiries[index];
}
