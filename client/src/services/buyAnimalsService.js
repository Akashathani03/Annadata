import { getListings, getListingById, getListingSeller } from './listingsService';
import { animalCatalog } from '../config/animalCatalog';
import { distanceKm } from '../utils/geo';

// Mirrors buyCropsService.js exactly - same pipeline. Uses the
// purpose-specific getListingSeller (real backend, name only) rather
// than getUserById (stays mock-only, per the Step 6 finding).
async function enrichListing(listing) {
  const meta = animalCatalog.find((a) => a.id === listing.itemId);
  const seller = await getListingSeller(listing.id);

  return {
    ...listing,
    animalIcon: meta?.icon ?? '🐾',
    animalTypeName: meta?.name ?? '',
    animalKannadaName: meta?.kannadaName ?? '',
    // null (not a guessed group like 'cattle') for a farmer-typed animal
    // outside the catalog - it will show under "All" but won't be
    // silently mis-filed into a category chip it doesn't belong to.
    animalGroup: meta?.group ?? null,
    sellerName: seller?.name || 'Farmer',
  };
}

function withDistance(listing, buyerLat, buyerLng) {
  const dist =
    buyerLat != null && buyerLng != null && listing.lat != null && listing.lng != null
      ? distanceKm(buyerLat, buyerLng, listing.lat, listing.lng)
      : null; // never fake a distance when either point is unknown
  return { ...listing, distanceKm: dist };
}

export async function getBrowseAnimals({ query, category, sort, filters, buyerLat, buyerLng } = {}) {
  const listings = await getListings({ category: 'animal', status: 'published' });

  let list = await Promise.all(listings.map((l) => enrichListing(l)));
  list = list.map((l) => withDistance(l, buyerLat, buyerLng));

  if (query) {
    const q = query.trim().toLowerCase();
    list = list.filter((l) =>
      (l.itemName + ' ' + l.animalTypeName + ' ' + l.animalKannadaName + ' ' + (l.location || '')).toLowerCase().includes(q)
    );
  }

  if (category && category !== 'All') {
    list = list.filter((l) => l.animalGroup === category);
  }

  if (filters?.priceMin != null) list = list.filter((l) => l.price >= filters.priceMin);
  if (filters?.priceMax != null) list = list.filter((l) => l.price <= filters.priceMax);

  if (filters?.distance && filters.distance !== 'All') {
    const maxKm = parseFloat(filters.distance);
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

export async function getAnimalListingDetail(id, { buyerLat, buyerLng } = {}) {
  const listing = await getListingById(id);
  if (!listing || listing.status !== 'published') return null;
  const enriched = await enrichListing(listing);
  return withDistance(enriched, buyerLat, buyerLng);
}
