import { getListings, getListingById, getListingSeller } from './listingsService';
import { getCropCatalog } from './marketPricesService';
import { distanceKm } from '../utils/geo';

// Enriches a raw listing with display-only fields (crop icon/group,
// farmer name looked up from its actual owner, live distance). Never
// mutates the underlying listing. Uses the purpose-specific
// getListingSeller (real backend, name only) rather than getUserById
// (which stays mock-only, per the Step 6 finding that it unsafely
// served both a user's own profile and arbitrary lookups).
async function enrichListing(listing, catalog) {
  const meta = catalog.find((c) => c.id === listing.itemId);
  const seller = await getListingSeller(listing.id);

  return {
    ...listing,
    cropIcon: meta?.icon ?? '🌾',
    cropKannadaName: meta?.kannadaName ?? '',
    cropGroup: meta?.group ?? 'veg',
    farmerName: seller?.name || 'Farmer',
  };
}

function withDistance(listing, buyerLat, buyerLng) {
  const dist =
    buyerLat != null && buyerLng != null && listing.lat != null && listing.lng != null
      ? distanceKm(buyerLat, buyerLng, listing.lat, listing.lng)
      : null; // never fake a distance when either point is unknown
  return { ...listing, distanceKm: dist };
}

// query/category/sort/filters all mirror the prototype's bcRender()
// pipeline exactly: search -> category -> price filter -> distance
// filter -> sort. Business logic lives here, not in the component.
export async function getBrowseCrops({ query, category, sort, filters, buyerLat, buyerLng } = {}) {
  const [listings, catalog] = await Promise.all([
    getListings({ category: 'crop', status: 'published' }),
    getCropCatalog(),
  ]);

  let list = await Promise.all(listings.map((l) => enrichListing(l, catalog)));
  list = list.map((l) => withDistance(l, buyerLat, buyerLng));

  if (query) {
    const q = query.trim().toLowerCase();
    list = list.filter((l) => (l.itemName + ' ' + l.cropKannadaName).toLowerCase().includes(q));
  }

  if (category && category !== 'All') {
    list = list.filter((l) => l.cropGroup === category);
  }

  if (filters?.priceMin != null) list = list.filter((l) => l.price >= filters.priceMin);
  if (filters?.priceMax != null) list = list.filter((l) => l.price <= filters.priceMax);

  if (filters?.distance && filters.distance !== 'All') {
    const maxKm = parseFloat(filters.distance);
    // never exclude a listing just because its distance is unknown
    list = list.filter((l) => (l.distanceKm == null ? true : l.distanceKm <= maxKm));
  }

  if (sort === 'nearest') {
    const anyDistanceKnown = list.some((l) => l.distanceKm != null);
    if (anyDistanceKnown) {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else {
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
  } else if (sort === 'recent') {
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } else if (sort === 'price_low') {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_high') {
    list.sort((a, b) => b.price - a.price);
  }

  return list;
}

export async function getCropListingDetail(id, { buyerLat, buyerLng } = {}) {
  const [listing, catalog] = await Promise.all([getListingById(id), getCropCatalog()]);
  if (!listing || listing.status !== 'published') return null;
  const enriched = await enrichListing(listing, catalog);
  return withDistance(enriched, buyerLat, buyerLng);
}
