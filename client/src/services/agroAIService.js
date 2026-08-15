import { apiRequest } from './apiClient';
import * as agroAIRepository from '../repositories/agroAIRepository';

// Step 6: the three real-persistence functions below now call the
// actual backend (Steps 4/5), reusing the JWT flow from Step 5.5 via
// apiClient. sendMockDiagnosisResponse/sendMockTextResponse are
// UNCHANGED and still purely local mock content - no Gemini, no AI
// Gateway, no Intent Router, exactly as required. Every exported
// function name is identical to before; nothing that imports this
// module needs to change.

// Module-scoped, resets on every page load - this is what makes "the
// current session" work correctly with the "always start fresh"
// behavior already shipped: the first message of a fresh visit has no
// sessionId yet, the backend creates one, and every subsequent send in
// the same visit reuses it automatically.
let currentSessionId = null;

// The backend document uses _id; every consumer of a message object
// in this app (MessageBubble's key, retry lookups, etc.) reads .id.
function normalizeMessage(raw) {
  if (!raw) return raw;
  const { _id, __v, ...rest } = raw;
  return { id: _id ?? raw.id, ...rest };
}

// Images arrive here as data URLs (captured by ImageUploadSheet's
// FileReader) - the real backend needs actual file bytes via
// multipart, per Step 5's design. This is the one place that
// conversion happens.
async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function getChatHistory(sessionId) {
  if (!sessionId) return [];
  const { messages } = await apiRequest(`/agro-ai/messages?sessionId=${sessionId}`);
  return messages.map(normalizeMessage);
}

// ownerId/status are accepted but unused now - the backend derives
// the user from the auth token (never trusts a client-supplied
// identity for a write), and status on creation is purely optimistic
// local UI state now (see useAgroAIChat), not something sent to the
// server. Kept as accepted parameters so this signature still matches
// every existing call site exactly, no caller needed to change.
export async function sendUserMessage({ text, photoUrl }) {
  let result;

  if (photoUrl) {
    const blob = await dataUrlToBlob(photoUrl);
    const formData = new FormData();
    if (currentSessionId) formData.append('sessionId', currentSessionId);
    if (text) formData.append('text', text);
    formData.append('image', blob, 'photo.jpg');
    result = await apiRequest('/agro-ai/messages', { method: 'POST', body: formData, isFormData: true });
  } else {
    result = await apiRequest('/agro-ai/messages', {
      method: 'POST',
      body: { sessionId: currentSessionId, text },
    });
  }

  currentSessionId = result.sessionId;
  return normalizeMessage(result.message);
}

// Only ever meaningfully called for retry now (see useAgroAIChat) -
// the real backend has no concept of transitioning a freshly-created
// message from sending->sent server-side (Step 4's design creates
// with status 'sent' immediately); that transition is purely
// optimistic local UI state before the real fetch resolves.
export async function updateMessageStatus(id, status) {
  if (status !== 'sent') return null;
  const { message } = await apiRequest(`/agro-ai/messages/${id}/retry`, { method: 'POST' });
  return normalizeMessage(message);
}

// Step 15: real reply from the backend's Intent Router pipeline,
// replacing the naive "photo -> always diagnosis, text -> always
// generic reply" assumption useAgroAIChat used to make on its own.
// The backend now genuinely decides what kind of response fits -
// this function just asks for it and returns whatever comes back,
// whether that's a card or plain text.
export async function getAssistantReply(userMessageId, { lat, lng } = {}) {
  const body = {};
  if (lat != null) body.lat = lat;
  if (lng != null) body.lng = lng;
  const { message } = await apiRequest(`/agro-ai/messages/${userMessageId}/reply`, {
    method: 'POST',
    body,
  });
  return normalizeMessage(message);
}

// UNCHANGED from before this step - still pure local mock content,
// inserted into the local mock repository, not sent to or read from
// the real backend at all. There is no backend endpoint for creating
// an assistant message; that only becomes real once Gemini/AI Gateway
// exist in a later step.
export async function sendMockDiagnosisResponse() {
  return agroAIRepository.insert({
    sender: 'assistant',
    type: 'card',
    cardType: 'diagnosis',
    status: 'sent',
    cardData: {
      problem: 'Early blight',
      severity: 'Medium',
      suggestedAction: 'Spray Mancozeb, remove infected leaves',
      disclaimer: 'AI diagnosis - confirm with a local expert.',
      confidence: "I'm quite sure, based on your photo.",
      likelyCause: 'Humid conditions with poor leaf airflow',
      prevention: 'Space plants for airflow and avoid overhead watering',
    },
  });
}

export async function sendMockTextResponse() {
  return agroAIRepository.insert({
    sender: 'assistant',
    type: 'text',
    status: 'sent',
    text: "Thanks - I'm looking into that for you. (Mock response for frontend testing.)",
  });
}
