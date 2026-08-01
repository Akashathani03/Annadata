import { buyerLocation } from '../data/buyerLocation';

export async function find() {
  return { ...buyerLocation };
}

export async function update(patch) {
  Object.assign(buyerLocation, patch);
  return { ...buyerLocation };
}
