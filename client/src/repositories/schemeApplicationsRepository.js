import { schemeApplications, nextApplicationId, persistSchemeApplications } from '../data/schemeApplications';

export async function findAll() {
  return schemeApplications;
}

export async function findBySchemeId(schemeId) {
  return schemeApplications.find((a) => a.schemeId === schemeId) ?? null;
}

export async function insert(applicationInput) {
  const application = { id: nextApplicationId(), ...applicationInput };
  schemeApplications.push(application);
  persistSchemeApplications();
  return application;
}
