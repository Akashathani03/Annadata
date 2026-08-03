import { apiRequest } from './apiClient';
import { getShopCatalogItem } from '../config/shopProductCatalog';

// Step 9: internals now call the real Shops domain service (backend).
// Function names/signatures unchanged. resolveCatalogIcon below is
// untouched on purpose - it's a pure, synchronous, local lookup
// against static config with zero network dependency, not something
// that should become an async backend call.

function normalizeProduct(product) {
  if (!product) return null;
  const { _id, __v, ...rest } = product;
  return { id: _id, ...rest };
}

export async function getMyProducts(shopId) {
  const { products } = await apiRequest(`/shops/${shopId}/products`);
  return products.map(normalizeProduct);
}

// items: [{ itemId, name, category, price, availability }]
export async function addProducts(shopId, items) {
  const { products } = await apiRequest(`/shops/${shopId}/products`, {
    method: 'POST',
    body: { items },
  });
  return products.map(normalizeProduct);
}

export async function updateProduct(id, patch) {
  const { product } = await apiRequest(`/shops/products/${id}`, { method: 'PATCH', body: patch });
  return normalizeProduct(product);
}

export async function toggleAvailability(id) {
  const { product } = await apiRequest(`/shops/products/${id}/toggle-availability`, { method: 'PATCH' });
  return normalizeProduct(product);
}

export async function deleteProduct(id) {
  const { deleted } = await apiRequest(`/shops/products/${id}`, { method: 'DELETE' });
  return deleted;
}

export function resolveCatalogIcon(itemId) {
  return getShopCatalogItem(itemId)?.icon ?? '🛍️';
}
