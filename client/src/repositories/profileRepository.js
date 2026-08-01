import { profile } from '../data/farmerProfile';

export async function find() {
  return { ...profile };
}

export async function update(patch) {
  Object.assign(profile, patch);
  return { ...profile };
}
