import { Message } from '../models/Message.js';

// Data access only. Function shapes deliberately mirror the frontend's
// existing agroAIRepository.js (built against localStorage in Step 1
// of the frontend) so that swapping the frontend's internals to call
// a real API backed by these functions is a close, low-risk mapping,
// not a redesign.

export async function createMessage(data) {
  return Message.create(data);
}

export async function findMessageById(id) {
  return Message.findById(id);
}

export async function findMessagesBySession(sessionId) {
  return Message.find({ sessionId }).sort({ createdAt: 1 });
}

// Step 16: bounded fetch for short-term conversation context - sorts
// newest-first with a real MongoDB limit (not fetch-everything-then-
// slice-in-JS), then reverses back to chronological order to match
// findMessagesBySession's existing convention above.
export async function findRecentMessagesBySession(sessionId, limit) {
  const messages = await Message.find({ sessionId }).sort({ createdAt: -1 }).limit(limit);
  return messages.reverse();
}

export async function updateMessageStatus(id, status) {
  return Message.findByIdAndUpdate(id, { $set: { status } }, { new: true });
}
