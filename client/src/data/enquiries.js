const STORAGE_KEY = 'annadata_enquiries_v1';

function loadEnquiries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Shape mirrors the approved `enquiries` schema:
// { listingId, ownerId, enquirer, message, contactMethod, status, createdAt }
export const enquiries = loadEnquiries();

export function persistEnquiries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enquiries));
  } catch {
    // Storage quota or unavailable - fail silently for MVP.
  }
}

let idCounter = 1;
export function nextEnquiryId() {
  return `enq_${Date.now()}_${idCounter++}`;
}
