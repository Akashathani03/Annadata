import { governmentSchemes } from '../data/governmentSchemes';

export async function findAll() {
  return governmentSchemes;
}

export async function findById(id) {
  return governmentSchemes.find((s) => s.id === id) ?? null;
}
