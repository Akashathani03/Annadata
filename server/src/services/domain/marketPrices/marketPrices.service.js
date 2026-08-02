import { ApiError } from '../../../utils/ApiError.js';
import { distanceKm } from '../../../utils/geo.js';
import * as apmcMarketRepository from '../../../repositories/apmcMarket.repository.js';
import * as cropRepository from '../../../repositories/crop.repository.js';
import * as marketPriceRepository from '../../../repositories/marketPrice.repository.js';

// Mirrors the frontend's getApmcMarkets exactly: with lat/lng, every
// market gets a live-computed distanceKm and the whole list is sorted
// by it, with the closest flagged isNearest. Without coordinates,
// returns markets in their natural order with no isNearest flag -
// same fallback behavior the frontend already has (it separately
// falls back to a fixed nearestApmcId in that case, which was a
// static seed-data value; the real backend has no equivalent fixed
// flag, so "no coordinates" now consistently means "no isNearest"
// rather than reintroducing a hardcoded id).
export async function getApmcMarkets({ lat, lng } = {}) {
  const markets = await apmcMarketRepository.findAll();
  const plain = markets.map((m) => m.toObject({ virtuals: false }));

  if (lat == null || lng == null) {
    return plain.map((m) => ({ ...m, id: m._id }));
  }

  const withDistance = plain.map((m) => ({
    ...m,
    id: m._id,
    distanceKm: distanceKm(lat, lng, m.location.lat, m.location.lng),
  }));
  withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return withDistance.map((m, index) => ({ ...m, isNearest: index === 0 }));
}

export async function searchApmcMarkets(query) {
  if (!query?.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'A search query is required.');
  }
  const markets = await apmcMarketRepository.searchByNameOrDistrict(query.trim());
  return markets.map((m) => ({ ...m.toObject(), id: m._id }));
}

export async function getCropCatalog() {
  const crops = await cropRepository.findAll();
  return crops.map((c) => ({ ...c.toObject(), id: c._id }));
}

export async function searchCrops(query) {
  if (!query?.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'A search query is required.');
  }
  const crops = await cropRepository.searchByName(query.trim());
  return crops.map((c) => ({ ...c.toObject(), id: c._id }));
}

function toCropShape(crop) {
  return { ...crop.toObject(), id: crop._id };
}

// Mirrors getCropPricesForApmc exactly: price records for a market,
// each enriched with its crop's details, silently dropping any record
// whose crop reference doesn't resolve (matches the frontend's
// existing .filter((entry) => entry.crop) safety net).
export async function getCropPricesForApmc(apmcId) {
  const prices = await marketPriceRepository.findByApmc(apmcId);
  if (prices.length === 0) return [];

  const cropIds = [...new Set(prices.map((p) => p.cropId))];
  const crops = await cropRepository.findByIds(cropIds);
  const cropById = new Map(crops.map((c) => [c._id, toCropShape(c)]));

  return prices
    .map((p) => ({ ...p.toObject(), crop: cropById.get(p.cropId) }))
    .filter((entry) => entry.crop);
}

// Same 3-day synthetic drift the frontend's buildRecentHistory already
// generates client-side - there is no real historical price collection
// (never was, on the frontend either), so this reproduces the exact
// same fake-but-consistent shape rather than introducing a genuinely
// different feature under the same field name.
function buildRecentHistory(basePrice) {
  const today = new Date();
  return [0, 1, 2].map((daysAgo) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const drift = daysAgo * 0.02;
    return {
      date: date.toISOString().slice(0, 10),
      minPrice: Math.round(basePrice.minPrice * (1 - drift)),
      modalPrice: Math.round(basePrice.modalPrice * (1 - drift)),
      maxPrice: Math.round(basePrice.maxPrice * (1 - drift)),
    };
  });
}

// Mirrors getCropPriceDetail exactly: returns null (not a thrown
// error) when no price record or crop exists, matching CropDetail.jsx
// and BuyCrops/Detail.jsx's existing "detail === null -> not found UI"
// handling - this is a deliberate design match, not an omission of
// error handling.
export async function getCropPriceDetail(apmcId, cropId) {
  const entry = await marketPriceRepository.findOne(apmcId, cropId);
  if (!entry) return null;

  const [crop, apmc] = await Promise.all([
    cropRepository.findById(cropId),
    apmcMarketRepository.findById(apmcId),
  ]);
  if (!crop) return null;

  return {
    crop: toCropShape(crop),
    apmc: apmc ? { ...apmc.toObject(), id: apmc._id } : null,
    minPrice: entry.minPrice,
    modalPrice: entry.modalPrice,
    maxPrice: entry.maxPrice,
    priceDate: entry.priceDate,
    recentHistory: buildRecentHistory(entry),
  };
}
