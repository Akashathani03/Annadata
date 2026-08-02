import { ApmcMarket } from '../models/ApmcMarket.js';

export async function findAll() {
  return ApmcMarket.find();
}

export async function findById(id) {
  return ApmcMarket.findById(id);
}

// Case-insensitive partial match on name or district - the actual
// relevance/ranking logic (if any) belongs in the service, not here.
export async function searchByNameOrDistrict(query) {
  const regex = new RegExp(query, 'i');
  return ApmcMarket.find({ $or: [{ name: regex }, { district: regex }] });
}
