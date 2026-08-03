import { apiRequest } from './apiClient';

// Step 9: internals now call the real Shops domain service (backend).
// Function names/signatures unchanged - MyShop.jsx, Products.jsx, and
// Dashboard.jsx need no changes. The backend always operates on the
// authenticated user's own shop (never trusts a client-supplied
// ownerId for a write), so ownerId here is accepted for interface
// compatibility but not forwarded as a body field.

function normalizeShop(shop) {
  if (!shop) return null;
  const { _id, __v, ...rest } = shop;
  return { id: _id, ...rest };
}

export async function getMyShop(ownerId) {
  const { shop } = await apiRequest('/shops/me');
  return normalizeShop(shop);
}

export async function getShopById(id) {
  const { detail } = await apiRequest(`/near-shops/${id}`);
  return detail ? normalizeShop(detail) : null;
}

// A photoUrl that's already a real URL (from a previous save) is sent
// through as a plain field, never re-uploaded. Only a fresh data URL
// (captured by PhotoUpload's FileReader) gets converted to a real
// file upload - the backend only ever trusts photoUrl values that
// came from its own upload path, never an arbitrary client string.
export async function saveShop(ownerId, patch) {
  const { photoUrl, ...rest } = patch;
  const isNewPhoto = typeof photoUrl === 'string' && photoUrl.startsWith('data:');

  let shop;
  if (isNewPhoto) {
    const blob = await (await fetch(photoUrl)).blob();
    const formData = new FormData();
    Object.entries(rest).forEach(([key, value]) => {
      if (value != null) formData.append(key, value);
    });
    formData.append('photo', blob, 'shop-photo.jpg');
    ({ shop } = await apiRequest('/shops/me', { method: 'PUT', body: formData, isFormData: true }));
  } else {
    ({ shop } = await apiRequest('/shops/me', { method: 'PUT', body: { ...rest, photoUrl } }));
  }
  return normalizeShop(shop);
}
