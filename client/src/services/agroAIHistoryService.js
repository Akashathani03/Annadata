import { apiRequest } from './apiClient';

// Previous Chats' one entry point for session-level (not message-level)
// operations - agroAIService.js stays focused on sending/replying,
// this file is the list/rename/delete surface, kept separate the same
// way listingsService.js and usersService.js are already kept apart
// rather than one large combined service.

function normalizeSession(raw) {
  if (!raw) return raw;
  const { _id, __v, ...rest } = raw;
  return { id: _id ?? raw.id, ...rest };
}

export async function listConversations() {
  const { sessions } = await apiRequest('/agro-ai/sessions');
  return sessions.map(normalizeSession);
}

export async function renameConversation(id, title) {
  const { session } = await apiRequest(`/agro-ai/sessions/${id}`, { method: 'PATCH', body: { title } });
  return normalizeSession(session);
}

export async function deleteConversation(id) {
  const { deleted } = await apiRequest(`/agro-ai/sessions/${id}`, { method: 'DELETE' });
  return deleted;
}

export async function setConversationPinned(id, pinned) {
  const { session } = await apiRequest(`/agro-ai/sessions/${id}`, { method: 'PATCH', body: { pinned } });
  return normalizeSession(session);
}
