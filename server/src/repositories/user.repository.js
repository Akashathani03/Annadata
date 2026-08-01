import { User } from '../models/User.js';

export async function findByPhone(phone) {
  return User.findOne({ phone });
}

export async function findById(id) {
  return User.findById(id);
}

export async function createUser(phone) {
  return User.create({ phone });
}

export async function updateById(id, patch) {
  return User.findByIdAndUpdate(id, { $set: patch }, { new: true });
}

// Matches the frontend's existing findOrCreateByPhone semantics
// exactly (same login shouldn't ever create a duplicate user record).
export async function findOrCreateByPhone(phone) {
  const existing = await findByPhone(phone);
  if (existing) return { user: existing, isNewUser: false };
  const user = await createUser(phone);
  return { user, isNewUser: true };
}
