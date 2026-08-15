import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { storageProvider } from '../../../storage/index.js';
import { routeMessage } from '../intentRouter/index.js';
import { generateCompletion, generateStructuredCompletion } from '../../../ai/gateway/index.js';
import {
  DIAGNOSIS_RESPONSE_SCHEMA,
  validateDiagnosisResponse,
  buildDiagnosisFallback,
  buildDiagnosisCardData,
} from '../../../ai/gateway/schemas/diagnosisSchema.js';
import {
  buildLookupReply,
  buildDiagnosisReply,
  buildTextReply,
  buildNavigateReply,
  buildOutOfScopeReply,
} from './replyBuilder.js';
import { CONTEXT_WINDOW_MESSAGES, buildConversationSummary } from './conversationContext.js';
import {
  createSession,
  findSessionById,
  touchSessionActivity,
} from '../../../repositories/session.repository.js';
import {
  createMessage,
  findMessageById,
  findMessagesBySession,
  findRecentMessagesBySession,
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

// Step 15: the second call of the two-call architecture ("persist
// user message" / "generate assistant reply", planned since the
// original Backend Architecture session, deferred at every step
// since). Reuses the exact same ownership pattern as retryMessage
// above (message -> its session -> that session's owner), the Intent
// Router (Step 14) for the routing decision, the Gateway's structured
// completion (Step 12) for the two generate sub-types, and the
// reply builder to shape the result into what the existing frontend
// already renders. No new decision-making logic lives here - this
// function only orchestrates already-approved pieces and persists the
// result.
export async function generateReply({ userId, messageId, lat, lng }) {
  assertValidObjectId(messageId, 'messageId');

  const userMessage = await findMessageById(messageId);
  if (!userMessage) {
    throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Message not found.');
  }
  const session = await getOwnedSessionOrThrow(userMessage.sessionId, userId);

  let imageBase64;
  let imageMimeType;
  if (userMessage.photoUrl) {
    const file = await storageProvider.readFile(userMessage.photoUrl);
    imageBase64 = file.buffer.toString('base64');
    imageMimeType = file.mimeType;
  }

  // Step 16: short-term context - the current session's recent
  // messages only, excluding this same message (which hasn't been
  // replied to yet and would just duplicate userMessage.text).
  // Bounded by CONTEXT_WINDOW_MESSAGES, reduced to a compact text
  // summary (never raw documents or card JSON) before it ever reaches
  // a prompt.
  const recentMessages = await findRecentMessagesBySession(session._id, CONTEXT_WINDOW_MESSAGES);
  const priorMessages = recentMessages.filter((m) => m._id.toString() !== userMessage._id.toString());
  const conversationSummary = buildConversationSummary(priorMessages);

  const decision = await routeMessage({
    userPrompt: userMessage.text || '(see attached photo)',
    imageBase64,
    imageMimeType,
    context: { lat, lng },
    conversationSummary,
  });

  let reply;
  if (decision.intent === 'lookup') {
    reply = buildLookupReply(decision.targetTool, decision.toolResult);
  } else if (decision.intent === 'diagnosis') {
    const result = await generateStructuredCompletion({
      taskType: 'generation',
      systemPrompt:
        `You are an agriculture assistant diagnosing a crop problem for an Indian farmer, based on their message and/or an attached photo. Only produce a real diagnosis when there is an actual symptom described or an image to analyze - if neither is present, ask plainly for a photo or a description rather than fabricating a diagnosis.${conversationSummary ? `\n\n${conversationSummary}` : ''}`,
      userPrompt: userMessage.text || 'Please diagnose the issue shown in the attached photo.',
      imageBase64,
      imageMimeType,
      responseSchema: DIAGNOSIS_RESPONSE_SCHEMA,
      validate: validateDiagnosisResponse,
      buildFallback: buildDiagnosisFallback,
    });
    reply = buildDiagnosisReply(buildDiagnosisCardData(result.data));
  } else if (decision.intent === 'conversation') {
    const result = await generateCompletion({
      taskType: 'generation',
      systemPrompt:
        `You are Agro AI, a friendly agricultural assistant helping farmers. Continue the conversation naturally using the recent conversation context. Speak simply, warmly, and clearly. If the farmer asks to explain, summarize, translate, or continue a previous answer, do so naturally. Do not generate diagnosis cards or structured lookup responses from this conversational prompt.${conversationSummary ? `\n\n${conversationSummary}` : ''}`,
      userPrompt: userMessage.text || '',
    });
    reply = buildTextReply(result.text);
  } else if (decision.intent === 'navigate') {
    reply = buildNavigateReply(decision.destination);
  } else {
    reply = buildOutOfScopeReply();
  }

  const assistantMessage = await createMessage({
    sessionId: session._id,
    sender: 'assistant',
    type: reply.type,
    text: reply.text || '',
    photoUrl: null,
    cardType: reply.cardType,
    cardData: reply.cardData,
    action: reply.action || null,
    status: 'sent',
  });

  await touchSessionActivity(session._id);

  return assistantMessage;
}
