import * as shopsRepository from '../repositories/shopsRepository';
import * as shopProductsRepository from '../repositories/shopProductsRepository';
import { shopProductCatalog } from '../config/shopProductCatalog';
import { distanceKm } from '../utils/geo';

// Public browse - reads only active (fully set-up) shops. Same
// single-marketplace principle as Buy Crops: no separate mock data,
// reads whatever Manage Shop actually saved.
export async function getNearbyShops({ query, buyerLat, buyerLng } = {}) {
  const shops = await shopsRepository.findAll();
  const allProducts = await shopProductsRepository.findAll();

  let list = shops.map((shop) => ({
    ...shop,
    distanceKm:
      buyerLat != null && buyerLng != null && shop.lat != null && shop.lng != null
        ? distanceKm(buyerLat, buyerLng, shop.lat, shop.lng)
        : null,
  }));

  if (query) {
    const q = query.trim().toLowerCase();
    list = list.filter((s) => {
      if (s.shopName.toLowerCase().includes(q)) return true;
      // Also match by product name - the search bar's own placeholder
      // ("Search seeds, fertilizers, pesticides...") promises this.
      return allProducts.some((p) => p.shopId === s.id && p.name.toLowerCase().includes(q));
    });
  }

  list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return list;
}

export async function getShopDetail(shopId, { buyerLat, buyerLng } = {}) {
  const shop = await shopsRepository.findById(shopId);
  if (!shop || shop.status !== 'active') return null;
  const products = await shopProductsRepository.findByShopId(shopId);
  const shopDistanceKm =
    buyerLat != null && buyerLng != null && shop.lat != null && shop.lng != null
      ? distanceKm(buyerLat, buyerLng, shop.lat, shop.lng)
      : null;
  return { ...shop, products, distanceKm: shopDistanceKm };
}

export async function searchProductsAcrossShops(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const matchingCatalogIds = shopProductCatalog
    .filter((p) => p.name.toLowerCase().includes(q) || p.kannadaName.includes(query.trim()))
    .map((p) => p.id);

  const products = await shopProductsRepository.findAll();
  const matches = products.filter(
    (p) => matchingCatalogIds.includes(p.itemId) || p.name.toLowerCase().includes(q)
  );

  const shops = await shopsRepository.findAll();
  return matches
    .map((p) => ({ product: p, shop: shops.find((s) => s.id === p.shopId) }))
    .filter((m) => m.shop);
}

// Real per-shop price for a specific catalog item, keyed by shopId.
// Only includes shops that actually stock it - never fabricated.
export async function getShopPricesForItem(itemId) {
  if (!itemId) return {};
  const products = await shopProductsRepository.findAll();
  const map = {};
  products.forEach((p) => {
    if (p.itemId === itemId && p.availability === 'In Stock') map[p.shopId] = p.price;
  });
  return map;
}

export async function getShopCountForItem(itemId) {
  const map = await getShopPricesForItem(itemId);
  return Object.keys(map).length;
}
