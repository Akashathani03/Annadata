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

// Previous Chats' list source - most-recently-active conversation
// first, matching how a farmer expects a chat list to be ordered.
export async function findSessionsByUser(userId) {
  return Session.find({ userId }).sort({ lastActivityAt: -1 });
}

// Generic partial update - covers rename (title) and pin/unpin
// (pinned), and any future single-field patch this same PATCH
// endpoint takes on, without needing a new repository function per
// field. patch is applied as-is via $set; the service layer is what
// decides which fields are valid and pre-validates their values.
export async function updateSession(id, patch) {
  return Session.findByIdAndUpdate(id, { $set: patch }, { new: true });
}

// Filtered by { title: null } so this can never overwrite a title a
// farmer already set (by hand, or from an earlier message in the same
// session) - see conversation.service.js's generateReply, the only
// caller. Returns the updated doc on success, null if a title already
// existed (nothing written) - both are valid, non-error outcomes.
export async function setSessionTitleIfUnset(id, title) {
  return Session.findOneAndUpdate({ _id: id, title: null }, { $set: { title } }, { new: true });
}

export async function deleteSession(id) {
  return Session.findByIdAndDelete(id);
}
