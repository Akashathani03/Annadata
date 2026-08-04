// Real end-to-end test for Step 16's conversation context. Builds an
// actual multi-turn conversation using the real service functions
// (sendMessage + generateReply, same as the real HTTP flow), then
// sends genuine follow-up messages that only make sense with context
// from the prior turn, and reports whether they resolved correctly.
//
// Requires a real GEMINI_API_KEY and a running MongoDB with seed data
// loaded, same as the other test scripts. Uses a fixed fake userId -
// no real auth needed since this calls the service layer directly.
//
// Usage: node scripts/test-conversation-context.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { sendMessage, generateReply } from '../src/services/agroAI/conversation/conversation.service.js';

dotenv.config();

const TEST_USER_ID = new mongoose.Types.ObjectId().toString();
const TEST_CONTEXT = { lat: 12.5242, lng: 76.8958 };

async function turn(sessionId, text) {
  const { message: userMessage, sessionId: sid } = await sendMessage({
    userId: TEST_USER_ID,
    sessionId,
    text,
  });
  const reply = await generateReply({
    userId: TEST_USER_ID,
    messageId: userMessage._id.toString(),
    lat: TEST_CONTEXT.lat,
    lng: TEST_CONTEXT.lng,
  });
  return { sessionId: sid, reply };
}

async function run() {
  await connectDatabase();

  console.log('=== Turn 1: establish context ===');
  console.log('Farmer: "What is the price of onion today?"');
  let { sessionId, reply } = await turn(undefined, 'What is the price of onion today?');
  console.log(`Assistant [${reply.cardType || 'text'}]:`, reply.cardType ? reply.cardData : reply.text);

  console.log('\n=== Turn 2: bare follow-up, no crop restated ===');
  console.log('Farmer: "is it available near me too?"');
  ({ sessionId, reply } = await turn(sessionId, 'is it available near me too?'));
  console.log(`Assistant [${reply.cardType || 'text'}]:`, reply.cardType ? reply.cardData : reply.text);

  console.log('\n=== Turn 3: transformation request referring to the last reply ===');
  console.log('Farmer: "summarize that in one line"');
  ({ sessionId, reply } = await turn(sessionId, 'summarize that in one line'));
  console.log(`Assistant [${reply.cardType || 'text'}]:`, reply.cardType ? reply.cardData : reply.text);

  console.log('\nDone. Check above: did turn 2 resolve "it" to onion, and did turn 3 actually reference the conversation rather than declining as out-of-scope?');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
