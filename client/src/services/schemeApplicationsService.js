import * as schemeApplicationsRepository from '../repositories/schemeApplicationsRepository';
import { getSchemeById } from './governmentSchemesService';

export async function getMyApplications() {
  return schemeApplicationsRepository.findAll();
}

// Matches the prototype's addAppliedTracker(): applying to a scheme
// you've already applied to is a no-op (returns the existing entry),
// new applications always start as 'Applied', submitted today.
export async function applyToScheme(schemeId) {
  const existing = await schemeApplicationsRepository.findBySchemeId(schemeId);
  if (existing) return existing;

  const scheme = await getSchemeById(schemeId);
  if (!scheme) return null;

  return schemeApplicationsRepository.insert({
    schemeId,
    schemeTitle: scheme.title,
    status: 'Applied',
    submittedAt: new Date().toISOString().slice(0, 10),
  });
}
