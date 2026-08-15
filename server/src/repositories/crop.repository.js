import { Crop } from '../models/Crop.js';

// findAll/findByIds/searchByName are all called exclusively by the
// Market Prices domain (marketPrices.service.js), which has always
// been crop-only - MarketPrice records only ever existed for crops,
// never animals, even after the Marketplace phase seeded animals into
// this same collection. Filtered to category:'crop' so a farmer
// browsing or selling crops never sees an animal leak into a crop
// dropdown or catalog (found via a real screenshot: Sell Crop's item
// picker was showing Cow/Buffalo/Goat alongside Tomato/Onion).
//
// findById below is deliberately left unfiltered - listings.service.js's
// assertValidItemForCategory genuinely needs to look up any item
// regardless of category, then validate the category match itself;
// filtering here would break that one legitimate cross-category need.
export async function findAll() {
  return Crop.find({ category: 'crop' });
}

export async function findById(id) {
  return Crop.findById(id);
}

export async function findByIds(ids) {
  return Crop.find({ _id: { $in: ids }, category: 'crop' });
}

// Matches on English or Kannada name - a farmer may search in either.
export async function searchByName(query) {
  const regex = new RegExp(query, 'i');
  return Crop.find({ category: 'crop', $or: [{ name: regex }, { kannadaName: regex }] });
}

// Generic across category (crop/animal/equipment), unlike the
// crop-only functions above - added specifically for the marketplace
// search tool's itemQuery -> itemId resolution (a farmer says
// "tractor", not a catalog id). Deliberately a new, separate function
// rather than removing the category:'crop' filter from findAll/
// searchByName - those two remain exclusively Market Prices' (crop
// tab autocomplete etc.), and broadening them risks the exact
// cross-category leak the existing comment above describes (animals
// once leaking into Sell Crop's item picker).
export async function searchByNameAndCategory(query, category) {
  const regex = new RegExp(query, 'i');
  return Crop.find({ category, $or: [{ name: regex }, { kannadaName: regex }] });
}
