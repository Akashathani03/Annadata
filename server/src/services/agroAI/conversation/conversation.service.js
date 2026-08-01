import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { storageProvider } from '../../../storage/index.js';
import {
  createSession,
  findSessionById,
  touchSessionActivity,
} from '../../../repositories/session.repository.js';
import {
  createMessage,
  findMessageById,
  findMessagesBySession,
  updateMessageStatus,
} from '../../../repositories/message.repository.js';

// Shared with the route layer (message.routes.js configures multer's
// own byte-ceiling with this same value, so the two limits can never
// drift apart into two different numbers).
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Validates an id is a well-formed MongoDB ObjectId before it's ever
// handed to Mongoose. Without this, a malformed id (a bad token's
// `sub` claim, a mistyped sessionId, etc.) surfaces as an uncaught
// Mongoose CastError - a raw 500, not a clean, expected failure. This
// is input validation, the same category as the existing empty-body
// check below, not business logic.
function assertValidObjectId(id, fieldName, statusCode = 400) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(statusCode, 'VALIDATION_ERROR', `${fieldName} is not a valid id.`);
  }
}

// Ownership check returns 404 for both "doesn't exist" and "exists but
// isn't yours" - deliberately not a distinct 403, so a request can
// never be used to confirm another user's session/message even
// exists. Per the Security & Deployment session's authorization
// requirement.
async function getOwnedSessionOrThrow(sessionId, userId) {
  assertValidObjectId(sessionId, 'sessionId');
  const session = await findSessionById(sessionId);
  if (!session || session.userId.toString() !== userId) {
    throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found.');
  }
  return session;
}

// Resolves which session a new message belongs to. If the caller
// already has one (a message sent earlier in the same visit), reuse
// it. If not, start a new one - this is what makes the endpoint work
// correctly today, when the frontend has no concept of a sessionId at
// all yet, and continue working once it's updated to track one.
async function resolveSession(sessionId, userId) {
  assertValidObjectId(userId, 'userId (from the authenticated token)', 401);
  if (sessionId) {
    return getOwnedSessionOrThrow(sessionId, userId);
  }
  return createSession(userId);
}

// imageFile is the raw multer file object ({ buffer, mimetype, size })
// when a real image was uploaded, or undefined for a text-only
// message. Unlike Step 4's placeholder behavior (which trusted a
// client-supplied photoUrl string as-is - the only option available
// before real storage existed), the actual photoUrl now only ever
// comes from storageProvider.saveFile(), never from client input
// directly. A client can no longer claim an arbitrary URL is "the
// photo" for a message.
export async function sendMessage({ userId, sessionId, text, imageFile }) {
  if (!text?.trim() && !imageFile) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'A message needs text, a photo, or both.');
  }

  let photoUrl = null;
  if (imageFile) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.mimetype)) {
      throw new ApiError(
        400,
        'INVALID_FILE_TYPE',
        `Unsupported image type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}.`
      );
    }
    const saved = await storageProvider.saveFile(imageFile.buffer, { mimeType: imageFile.mimetype });
    photoUrl = saved.url;
  }

  const session = await resolveSession(sessionId, userId);

  const message = await createMessage({
    sessionId: session._id,
    sender: 'user',
    type: photoUrl ? 'image' : 'text',
    text: text?.trim() || '',
    photoUrl,
    status: 'sent', // no real delivery/network layer exists yet at this step - see Step 4 notes
  });

  await touchSessionActivity(session._id);

  return { message, sessionId: session._id.toString() };
}

export async function getMessages({ userId, sessionId }) {
  if (!sessionId) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'sessionId is required.');
  }

  await getOwnedSessionOrThrow(sessionId, userId);
  return findMessagesBySession(sessionId);
}

export async function retryMessage({ userId, messageId }) {
  assertValidObjectId(messageId, 'messageId');

  const message = await findMessageById(messageId);
  if (!message) {
    throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Message not found.');
  }

  // Ownership is via the message's session, not a direct userId field
  // on Message itself (Message has no userId - only Session does, per
  // the Step 3 model design).
  await getOwnedSessionOrThrow(message.sessionId, userId);

  if (message.status !== 'failed') {
    throw new ApiError(409, 'MESSAGE_NOT_FAILED', 'Only a failed message can be retried.');
  }

  // Persistence-only retry (Step 4 scope): the message already exists
  // in the database - there is no real delivery/AI-generation step to
  // re-attempt yet, so "retry" here means acknowledging it as
  // successfully delivered. A later step (once Gemini/AI Gateway
  // exist) is what gives this a real failure mode to actually retry.
  return updateMessageStatus(messageId, 'sent');
}
