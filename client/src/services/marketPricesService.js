import { apmcMarkets, nearestApmcId } from '../data/apmcMarkets';
import { cropCatalog, getCropById } from '../data/cropCatalog';
import { marketPrices, buildRecentHistory } from '../data/marketPrices';
import { distanceKm } from '../utils/geo';

// This module's async function signatures are written to match the
// planned GET /api/apmc-markets and GET /api/market-prices?apmc=&crop=
// endpoints. When the backend exists, each function body becomes a
// fetch() call - callers (the screens) do not change.

// Pass { lat, lng } to get APMCs sorted by real distance from that
// point (each one's distanceKm is computed live, and the closest one
// is marked isNearest). Without coordinates, falls back to the static
// seed order and the fixed nearestApmcId flag.
export async function getApmcMarkets({ lat, lng } = {}) {
  if (lat != null && lng != null) {
    const withDistance = apmcMarkets.map((apmc) => ({
      ...apmc,
      distanceKm: apmc.location ? distanceKm(lat, lng, apmc.location.lat, apmc.location.lng) : apmc.distanceKm,
    }));
    withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return withDistance.map((apmc, index) => ({ ...apmc, isNearest: index === 0 }));
  }

  return apmcMarkets.map((apmc) => ({
    ...apmc,
    isNearest: apmc.id === nearestApmcId,
  }));
}

export async function getCropPricesForApmc(apmcId) {
  return marketPrices
    .filter((entry) => entry.apmcId === apmcId)
    .map((entry) => ({
      ...entry,
      crop: getCropById(entry.cropId),
    }))
    .filter((entry) => entry.crop);
}

export async function getCropPriceDetail(apmcId, cropId) {
  const entry = marketPrices.find((p) => p.apmcId === apmcId && p.cropId === cropId);
  if (!entry) return null;
  const crop = getCropById(cropId);
  if (!crop) return null;

  return {
    crop,
    apmc: apmcMarkets.find((a) => a.id === apmcId),
    minPrice: entry.minPrice,
    modalPrice: entry.modalPrice,
    maxPrice: entry.maxPrice,
    priceDate: entry.priceDate,
    recentHistory: buildRecentHistory(entry),
  };
}

export async function getCropCatalog() {
  return cropCatalog;
}
