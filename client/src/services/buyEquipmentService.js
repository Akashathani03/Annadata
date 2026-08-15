import { getListings, getListingById, getListingSeller } from './listingsService';
import { equipmentCatalog } from '../config/equipmentCatalog';
import { distanceKm } from '../utils/geo';

// Mirrors buyAnimalsService.js exactly - same pipeline, same
// purpose-specific getListingSeller usage.
async function enrichListing(listing) {
  const meta = equipmentCatalog.find((e) => e.id === listing.itemId);
  const seller = await getListingSeller(listing.id);

  return {
    ...listing,
    equipmentIcon: meta?.icon ?? '🚜',
    equipmentTypeName: meta?.name ?? '',
    equipmentKannadaName: meta?.kannadaName ?? '',
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

export async function getBrowseEquipment({ query, sort, filters, buyerLat, buyerLng } = {}) {
  const listings = await getListings({ category: 'equipment', status: 'published' });

  let list = await Promise.all(listings.map((l) => enrichListing(l)));
  list = list.map((l) => withDistance(l, buyerLat, buyerLng));

  if (query) {
    const q = query.trim().toLowerCase();
    list = list.filter((l) =>
      (l.itemName + ' ' + l.equipmentTypeName + ' ' + l.equipmentKannadaName + ' ' + (l.location || '')).toLowerCase().includes(q)
    );
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

export async function getEquipmentListingDetail(id, { buyerLat, buyerLng } = {}) {
  const listing = await getListingById(id);
  if (!listing || listing.status !== 'published') return null;
  const enriched = await enrichListing(listing);
  return withDistance(enriched, buyerLat, buyerLng);
}
