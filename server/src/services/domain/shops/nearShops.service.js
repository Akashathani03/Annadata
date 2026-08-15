import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { distanceKm } from '../../../utils/geo.js';
import { shopProductCatalog } from './shopProductCatalog.js';
import * as shopRepository from '../../../repositories/shop.repository.js';
import * as shopProductRepository from '../../../repositories/shopProduct.repository.js';

// Same pattern already established in conversation.service.js and
// listings.service.js - a malformed id is an input-validation
// problem, not a "not found" problem, and should never surface as a
// raw, unhandled Mongoose CastError falling through to a generic 500.
// Only getShopDetail below needs this - every other function here
// takes a search string or a catalog itemId (a string slug, not a
// Mongoose ObjectId), never a user-supplied ObjectId directly.
function assertValidObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${fieldName} is not a valid id.`);
  }
}

function toShopShape(shop) {
  return { ...shop.toObject(), id: shop._id.toString() };
}

// Mirrors getNearbyShops exactly: only active shops, live distance
// calculation when coordinates are given, search by shop name OR by
// whether the shop stocks a matching product, sorted nearest-first.
export async function getNearbyShops({ query, buyerLat, buyerLng } = {}) {
  const shops = await shopRepository.findAllActive();
  const allProducts = await shopProductRepository.findAll();

  let list = shops.map((shop) => {
    const shape = toShopShape(shop);
    return {
      ...shape,
      distanceKm:
        buyerLat != null && buyerLng != null && shape.lat != null && shape.lng != null
          ? distanceKm(buyerLat, buyerLng, shape.lat, shape.lng)
          : null,
    };
  });

  if (query) {
    const q = query.trim().toLowerCase();
    list = list.filter((s) => {
      if (s.shopName.toLowerCase().includes(q)) return true;
      return allProducts.some(
        (p) => p.shopId.toString() === s.id && p.name.toLowerCase().includes(q)
      );
    });
  }

  list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return list;
}

// Mirrors getShopDetail exactly: only visible if active, includes its
// products and a live distance calculation.
export async function getShopDetail(shopId, { buyerLat, buyerLng } = {}) {
  assertValidObjectId(shopId, 'shopId');
  const shop = await shopRepository.findById(shopId);
  if (!shop || shop.status !== 'active') return null;

  const products = await shopProductRepository.findByShopId(shopId);
  const shape = toShopShape(shop);
  const shopDistanceKm =
    buyerLat != null && buyerLng != null && shape.lat != null && shape.lng != null
      ? distanceKm(buyerLat, buyerLng, shape.lat, shape.lng)
      : null;

  return { ...shape, products, distanceKm: shopDistanceKm };
}

// Mirrors searchProductsAcrossShops exactly: expand the query against
// the static catalog (matching English or Kannada names) into a set
// of itemIds, then match any product whose itemId is in that set OR
// whose own stored name directly contains the query.
export async function searchProductsAcrossShops(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const trimmedOriginal = query.trim();

  const matchingCatalogIds = shopProductCatalog
    .filter((p) => p.name.toLowerCase().includes(q) || p.kannadaName.includes(trimmedOriginal))
    .map((p) => p.id);

  const products = await shopProductRepository.findAll();
  const matches = products.filter(
    (p) => matchingCatalogIds.includes(p.itemId) || p.name.toLowerCase().includes(q)
  );

  const shops = await shopRepository.findAllActive();
  return matches
    .map((p) => ({
      product: { ...p.toObject(), id: p._id.toString() },
      shop: shops.find((s) => s._id.toString() === p.shopId.toString()),
    }))
    .filter((m) => m.shop)
    .map((m) => ({ product: m.product, shop: toShopShape(m.shop) }));
}

// Real per-shop price for a specific catalog item, keyed by shopId -
// only shops that actually stock it, never fabricated. Mirrors
// getShopPricesForItem exactly.
export async function getShopPricesForItem(itemId) {
  if (!itemId) return {};
  const products = await shopProductRepository.findAll();
  const map = {};
  products.forEach((p) => {
    if (p.itemId === itemId && p.availability === 'In Stock') {
      map[p.shopId.toString()] = p.price;
    }
  });
  return map;
}

export async function getShopCountForItem(itemId) {
  const map = await getShopPricesForItem(itemId);
  return Object.keys(map).length;
}
