import { agroAIMessages, nextMessageId, persistAgroAIMessages } from '../data/agroAIMessages';

// MVP has exactly one implicit session per user (see PDS Section 20/21),
// so ownerId alone is enough to find "the" thread today. sessionId is
// still stored on every message now so a future multi-session query
// (findAll({ ownerId, sessionId })) is additive, not a rewrite.
export async function findAll({ ownerId } = {}) {
  return agroAIMessages.filter((m) => !ownerId || m.ownerId === ownerId);
}

export async function insert(messageInput) {
  const message = {
    id: nextMessageId(),
    status: 'sent',
    createdAt: Date.now(),
    ...messageInput,
  };
  agroAIMessages.push(message);
  persistAgroAIMessages();
  return message;
}

export async function updateStatus(id, status) {
  const index = agroAIMessages.findIndex((m) => m.id === id);
  if (index === -1) return null;
  agroAIMessages[index] = { ...agroAIMessages[index], status };
  persistAgroAIMessages();
  return agroAIMessages[index];
}

export async function update(id, patch) {
  const index = agroAIMessages.findIndex((m) => m.id === id);
  if (index === -1) return null;
  agroAIMessages[index] = { ...agroAIMessages[index], ...patch };
  persistAgroAIMessages();
  return agroAIMessages[index];
}
