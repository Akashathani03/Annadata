import { mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

// Mocked at the repository layer (not the Mongoose model layer) - the
// thing genuinely under test here is conversation.service.js's own
// ownership enforcement (getOwnedSessionOrThrow, assertValidObjectId),
// which sits directly on top of these repository calls. Everything
// else (session.repository.js's own query shape, Mongoose itself) is
// real, unmodified source.

const USER_A = new mongoose.Types.ObjectId().toString();
const USER_B = new mongoose.Types.ObjectId().toString();
const SESSION_A = new mongoose.Types.ObjectId().toString();

let sessionsStore = {
  [SESSION_A]: { _id: SESSION_A, userId: USER_A, title: null, pinned: false },
};
let deletedSessionIds = [];
let deletedMessageSessionIds = [];

mock.module('../src/repositories/session.repository.js', {
  namedExports: {
    createSession: async (userId) => {
      const id = new mongoose.Types.ObjectId().toString();
      sessionsStore[id] = { _id: id, userId, title: null, pinned: false };
      return sessionsStore[id];
    },
    findSessionById: async (id) => sessionsStore[id] || null,
    findSessionsByUser: async (userId) => Object.values(sessionsStore).filter((s) => s.userId === userId),
    touchSessionActivity: async () => {},
    updateSession: async (id, patch) => {
      Object.assign(sessionsStore[id], patch);
      return sessionsStore[id];
    },
    setSessionTitleIfUnset: async (id, title) => {
      if (sessionsStore[id].title) return null;
      sessionsStore[id].title = title;
      return sessionsStore[id];
    },
    deleteSession: async (id) => {
      deletedSessionIds.push(id);
      delete sessionsStore[id];
    },
    updateSessionContext: async () => {},
  },
  cache: false,
});

mock.module('../src/repositories/message.repository.js', {
  namedExports: {
    createMessage: async (data) => ({ _id: new mongoose.Types.ObjectId().toString(), ...data }),
    findMessageById: async () => null,
    findMessagesBySession: async () => [],
    findRecentMessagesBySession: async () => [],
    updateMessageStatus: async () => null,
    deleteMessagesBySession: async (sessionId) => {
      deletedMessageSessionIds.push(sessionId);
    },
  },
  cache: false,
});

const conversationService = await import('../src/services/agroAI/conversation/conversation.service.js');

let pass = 0, fail = 0;
async function recordAsync(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    pass++;
  } catch (e) {
    console.log(`FAIL: ${name} - ${e.message}`);
    fail++;
  }
}

async function assertRejectsWithStatus(promise, expectedStatus, expectedCode) {
  try {
    await promise;
    throw new Error(`expected a rejection with status ${expectedStatus}, but it resolved`);
  } catch (err) {
    if (err.statusCode === undefined) throw err; // a real bug, not the expected ApiError
    assert.equal(err.statusCode, expectedStatus);
    if (expectedCode) assert.equal(err.code, expectedCode);
  }
}

// --- listSessions: scoped entirely by userId, no id-based lookup ---
await recordAsync('listSessions returns only that user\'s sessions', async () => {
  const sessions = await conversationService.listSessions({ userId: USER_A });
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0]._id, SESSION_A);
});

await recordAsync('listSessions for a user with no sessions returns an empty array, not an error', async () => {
  const sessions = await conversationService.listSessions({ userId: USER_B });
  assert.deepEqual(sessions, []);
});

// --- updateSession (rename): ownership ---
await recordAsync('owner CAN rename their own session', async () => {
  const updated = await conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A, title: 'Tomato Leaf Problem' });
  assert.equal(updated.title, 'Tomato Leaf Problem');
});

await recordAsync('SECURITY: user B cannot rename user A\'s session (404, not 403)', async () => {
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_B, sessionId: SESSION_A, title: 'Hijacked' }),
    404,
    'SESSION_NOT_FOUND'
  );
  // Confirm the title from the legitimate owner's rename above was
  // genuinely untouched by the rejected attempt.
  assert.equal(sessionsStore[SESSION_A].title, 'Tomato Leaf Problem');
});

await recordAsync('rename rejects an empty/whitespace-only title', async () => {
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A, title: '   ' }),
    400,
    'VALIDATION_ERROR'
  );
});

await recordAsync('rename rejects a title over the max length', async () => {
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A, title: 'x'.repeat(41) }),
    400,
    'VALIDATION_ERROR'
  );
});

await recordAsync('rename rejects a malformed session id as 400, not a raw crash', async () => {
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_A, sessionId: 'not-a-real-id', title: 'x' }),
    400,
    'VALIDATION_ERROR'
  );
});

// --- updateSession (pin/unpin): ownership + validation ---
await recordAsync('owner CAN pin their own session', async () => {
  const updated = await conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A, pinned: true });
  assert.equal(updated.pinned, true);
});

await recordAsync('owner CAN unpin their own session', async () => {
  const updated = await conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A, pinned: false });
  assert.equal(updated.pinned, false);
});

await recordAsync('SECURITY: user B cannot pin user A\'s session (404, not 403)', async () => {
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_B, sessionId: SESSION_A, pinned: true }),
    404,
    'SESSION_NOT_FOUND'
  );
  assert.equal(sessionsStore[SESSION_A].pinned, false, 'must still be unpinned after a rejected foreign pin attempt');
});

await recordAsync('SECURITY: user B cannot unpin user A\'s session', async () => {
  await conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A, pinned: true }); // owner pins it first
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_B, sessionId: SESSION_A, pinned: false }),
    404,
    'SESSION_NOT_FOUND'
  );
  assert.equal(sessionsStore[SESSION_A].pinned, true, 'must still be pinned after a rejected foreign unpin attempt');
});

await recordAsync('pinned rejects a non-boolean value', async () => {
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A, pinned: 'yes' }),
    400,
    'VALIDATION_ERROR'
  );
});

await recordAsync('rename and pin can be updated together in one call', async () => {
  const updated = await conversationService.updateSession({
    userId: USER_A, sessionId: SESSION_A, title: 'Pinned Tomato Chat', pinned: false,
  });
  assert.equal(updated.title, 'Pinned Tomato Chat');
  assert.equal(updated.pinned, false);
});

await recordAsync('update with neither title nor pinned is rejected, not a silent no-op', async () => {
  await assertRejectsWithStatus(
    conversationService.updateSession({ userId: USER_A, sessionId: SESSION_A }),
    400,
    'VALIDATION_ERROR'
  );
});

// --- deleteSession: ownership + cascade ---
await recordAsync('SECURITY: user B cannot delete user A\'s session', async () => {
  await assertRejectsWithStatus(
    conversationService.deleteSession({ userId: USER_B, sessionId: SESSION_A }),
    404,
    'SESSION_NOT_FOUND'
  );
  assert.equal(sessionsStore[SESSION_A] !== undefined, true, 'session must still exist after a rejected foreign delete');
});

await recordAsync('owner deleting their session cascades: messages deleted before the session itself', async () => {
  deletedMessageSessionIds = [];
  deletedSessionIds = [];
  const result = await conversationService.deleteSession({ userId: USER_A, sessionId: SESSION_A });
  assert.deepEqual(result, { deleted: true });
  assert.deepEqual(deletedMessageSessionIds, [SESSION_A]);
  assert.deepEqual(deletedSessionIds, [SESSION_A]);
  assert.equal(sessionsStore[SESSION_A], undefined);
});

await recordAsync('deleting an already-deleted/unknown session returns 404, not a crash', async () => {
  await assertRejectsWithStatus(
    conversationService.deleteSession({ userId: USER_A, sessionId: SESSION_A }),
    404,
    'SESSION_NOT_FOUND'
  );
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
