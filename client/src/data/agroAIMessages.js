const STORAGE_KEY = 'annadata_agroai_messages_v1';

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Single continuous thread per user for MVP (see PDS Section 21/20).
// Every message already carries a sessionId field even though MVP only
// ever has one implicit session - this is what lets multi-chat
// (PDS Section 17, post-MVP) be a UI addition later, not a schema
// migration, exactly as decided in the PDS.
//
// Shape per message:
// { id, ownerId, sessionId, sender: 'user' | 'ai', type: 'text' | 'image' | 'card',
//   text, photoUrl, cardType, cardData, status: 'sent' | 'pending' | 'failed',
//   createdAt }
export const agroAIMessages = loadMessages();

export function persistAgroAIMessages() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agroAIMessages));
  } catch {
    // Storage quota or unavailable - fail silently for MVP, matches
    // every other data store's error handling in this app.
  }
}

let idCounter = 1;
export function nextMessageId() {
  return `agroai_msg_${Date.now()}_${idCounter++}`;
}
