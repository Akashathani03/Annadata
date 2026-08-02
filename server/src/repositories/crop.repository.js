import { Crop } from '../models/Crop.js';

export async function findAll() {
  return Crop.find();
}

export async function findById(id) {
  return Crop.findById(id);
}

export async function findByIds(ids) {
  return Crop.find({ _id: { $in: ids } });
}

// Matches on English or Kannada name - a farmer may search in either.
export async function searchByName(query) {
  const regex = new RegExp(query, 'i');
  return Crop.find({ $or: [{ name: regex }, { kannadaName: regex }] });
}
