import { Session } from '../models/Session.js';

// Data access only - no business logic, no orchestration with Message
// (e.g. this never decides *when* lastActivityAt should update; that
// decision belongs to whichever future service calls
// touchSessionActivity, not to this file).

export async function createSession(userId) {
  return Session.create({ userId });
}

export async function findSessionById(id) {
  return Session.findById(id);
}

export async function findSessionsByUser(userId) {
  return Session.find({ userId }).sort({ createdAt: -1 });
}

// Partial/incremental update by design (per the Database session's
// "incrementally-updated" framing) - only the fields actually passed
// in contextPatch are touched, so updating recentCropName alone never
// wipes out an unrelated recentDiagnosisSummary already stored.
export async function updateSessionContext(id, contextPatch) {
  const setFields = {};
  for (const [key, value] of Object.entries(contextPatch)) {
    setFields[`context.${key}`] = value;
  }
  setFields['context.updatedAt'] = new Date();

  return Session.findByIdAndUpdate(id, { $set: setFields }, { new: true });
}

export async function touchSessionActivity(id) {
  return Session.findByIdAndUpdate(id, { $set: { lastActivityAt: new Date() } }, { new: true });
}
