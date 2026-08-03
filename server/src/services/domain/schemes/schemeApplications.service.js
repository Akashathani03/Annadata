import * as schemeApplicationRepository from '../../../repositories/schemeApplication.repository.js';
import * as governmentSchemeRepository from '../../../repositories/governmentScheme.repository.js';

function toApplicationShape(app) {
  return { ...app.toObject(), id: app._id.toString() };
}

export async function getMyApplications(userId) {
  const apps = await schemeApplicationRepository.findAllByUser(userId);
  return apps.map(toApplicationShape);
}

// Matches the mock's exact addAppliedTracker() behavior: applying to a
// scheme you've already applied to is a no-op (returns the existing
// entry), new applications always start as 'Applied', submitted today.
// Now scoped to userId - the necessary correction explained in the
// SchemeApplication model, not new business logic invented here.
export async function applyToScheme(userId, schemeId) {
  const existing = await schemeApplicationRepository.findByUserAndScheme(userId, schemeId);
  if (existing) return toApplicationShape(existing);

  const scheme = await governmentSchemeRepository.findById(schemeId);
  if (!scheme) return null;

  const application = await schemeApplicationRepository.insert({
    userId,
    schemeId,
    schemeTitle: scheme.title,
    status: 'Applied',
    submittedAt: new Date().toISOString().slice(0, 10),
  });
  return toApplicationShape(application);
}
