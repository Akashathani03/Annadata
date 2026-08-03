import { Shop } from '../models/Shop.js';

export async function findByOwnerId(ownerId) {
  return Shop.findOne({ ownerId });
}

export async function findById(id) {
  return Shop.findById(id);
}

export async function findAllActive() {
  return Shop.find({ status: 'active' });
}

// Mirrors the frontend's exact upsert semantics: patch if a shop
// already exists for this owner, otherwise create one with sensible
// defaults. Business logic (what counts as "complete") stays in the
// service - this only performs the write.
//
// ownerId/_id/__v are explicitly stripped from patch before use - a
// client-supplied ownerId (e.g. echoed back from a previous getMyShop
// response that was spread into form state) would otherwise collide
// with the $setOnInsert below: MongoDB correctly refuses an update
// where two different operators both target the same path ("Updating
// the path 'ownerId' would create a conflict"). ownerId can only ever
// come from the query filter, never from the patch itself.
export async function upsertByOwnerId(ownerId, patch) {
  const { ownerId: _ignoredOwnerId, _id, __v, createdAt, updatedAt, ...safePatch } = patch;

  return Shop.findOneAndUpdate(
    { ownerId },
    { $set: safePatch, $setOnInsert: { ownerId } },
    { upsert: true, new: true }
  );
}
