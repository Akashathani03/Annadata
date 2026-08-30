import { Listing } from '../models/Listing.js';
import { distanceKm } from '../utils/geo.js';

// query now reaches here from farmer free-text (Agro AI's
// search_marketplace_listings, via a Gemini-extracted phrase) as well
// as any future direct caller - escaping is required so a stray
// regex-special character in what someone typed can't throw or be
// misinterpreted as a pattern.
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findAll({ category, status, query, itemId, priceMax, condition, lat, lng, radiusKm, page = 1, limit = 20 } = {}) {
  const dbQuery = {};
  if (category) dbQuery.category = category;
  if (status) dbQuery.status = status;
  if (query) dbQuery.itemName = new RegExp(escapeRegExp(query.trim()), 'i');
  if (itemId) dbQuery.itemId = itemId;
  if (priceMax != null) dbQuery.price = { $lte: priceMax };
  if (condition) dbQuery.condition = condition;

  // Distance filtering is deliberately isolated to this block, kept
  // separate from the plain dbQuery above - a future MongoDB
  // geospatial index/query can replace only this section without
  // changing findAll's signature or any caller. Not a DB-level $near
  // today (no 2dsphere index exists, and this app's scale doesn't
  // need one yet) - a straightforward post-fetch filter using the
  // exact same great-circle math the frontend's utils/geo.js already
  // uses for client-side distance display.
  if (radiusKm != null) {
    const all = await Listing.find(dbQuery).sort({ createdAt: -1 });
    const withinRadius = all.filter((doc) => {
      const d = distanceKm(lat, lng, doc.lat, doc.lng);
      return d != null && d <= radiusKm;
    });
    const total = withinRadius.length;
    const skip = (page - 1) * limit;
    const items = withinRadius.slice(skip, skip + limit);
    return { items, total };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Listing.find(dbQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(dbQuery),
  ]);

  return { items, total };
}

export async function findByOwner({ ownerId, category, status, page = 1, limit = 20 } = {}) {
  const query = { ownerId };
  if (category) query.category = category;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Listing.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(query),
  ]);

  return { items, total };
}

// Queried at the database level (status:'closed' AND soldAt present),
// not a post-fetch filter - correct even if a future closure reason
// other than a sale is ever added (see the model's own comment on
// this), and correct together with pagination, unlike filtering an
// already-paginated result would be.
export async function findSalesByOwner({ ownerId, page = 1, limit = 20 } = {}) {
  const query = { ownerId, status: 'closed', soldAt: { $ne: null } };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Listing.find(query).sort({ soldAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(query),
  ]);

  return { items, total };
}

export async function findById(id) {
  return Listing.findById(id);
}

export async function insert(listingInput) {
  return Listing.create(listingInput);
}

export async function update(id, patch) {
  return Listing.findByIdAndUpdate(id, { $set: patch }, { new: true });
}

export async function remove(id) {
  const result = await Listing.findByIdAndDelete(id);
  return result !== null;
}
