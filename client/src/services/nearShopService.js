import { apiRequest } from './apiClient';

// Step 9: internals now call the real Shops domain service (backend).
// Function names/signatures unchanged - Browse.jsx and Detail.jsx
// need no changes.

function normalizeShop(shop) {
  if (!shop) return null;
  const { _id, __v, ...rest } = shop;
  return { id: _id, ...rest };
}

function normalizeProduct(product) {
  if (!product) return null;
  const { _id, __v, ...rest } = product;
  return { id: _id, ...rest };
}

export async function getNearbyShops({ query, buyerLat, buyerLng } = {}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (buyerLat != null) params.set('lat', buyerLat);
  if (buyerLng != null) params.set('lng', buyerLng);
  const { shops } = await apiRequest(`/near-shops?${params.toString()}`);
  return shops.map(normalizeShop);
}

export async function getShopDetail(shopId, { buyerLat, buyerLng } = {}) {
  const params = new URLSearchParams();
  if (buyerLat != null) params.set('lat', buyerLat);
  if (buyerLng != null) params.set('lng', buyerLng);
  const { detail } = await apiRequest(`/near-shops/${shopId}?${params.toString()}`);
  if (!detail) return null;
  const { products, ...shopFields } = detail;
  return { ...normalizeShop(shopFields), products: products.map(normalizeProduct) };
}

export async function searchProductsAcrossShops(query) {
  if (!query || query.trim().length < 2) return [];
  const { results } = await apiRequest(`/near-shops/products/search?q=${encodeURIComponent(query)}`);
  return results.map((m) => ({ product: normalizeProduct(m.product), shop: normalizeShop(m.shop) }));
}

export async function getShopPricesForItem(itemId) {
  if (!itemId) return {};
  const { prices } = await apiRequest(`/near-shops/products/prices?itemId=${encodeURIComponent(itemId)}`);
  return prices;
}

export async function getShopCountForItem(itemId) {
  const { count } = await apiRequest(`/near-shops/products/count?itemId=${encodeURIComponent(itemId)}`);
  return count;
}
