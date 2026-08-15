// Reusable test script for the Intent Router, updated for the flat
// 5-intent architecture (lookup/diagnosis/conversation/navigate/
// out_of_scope - no nested generationType). Requires a real
// GEMINI_API_KEY and a running MongoDB with the Steps 7/9/10 seed
// data loaded.
//
// Usage: node scripts/test-intent-router.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { routeMessage } from '../src/services/agroAI/intentRouter/index.js';

dotenv.config();

const TEST_CONTEXT = { lat: 12.5242, lng: 76.8958 };

const testCases = [
  { label: 'Lookup', prompt: 'What is the price of onion today?' },
  { label: 'Diagnosis', prompt: 'My tomato leaves have yellow spots and are wilting, what is wrong?' },
  { label: 'Conversation - greeting', prompt: 'Hello, how are you today?' },
  { label: 'Conversation - acknowledgement', prompt: 'Okay, thank you.' },
  { label: 'Conversation - general farming question', prompt: 'When is the best time to sow ragi in Karnataka?' },
  { label: 'Conversation - transformation request', prompt: 'Can you explain that more simply?' },
  { label: 'Navigate', prompt: 'Take me to the page where I can sell my crops' },
  { label: 'Out of scope', prompt: 'What is the capital of France?' },
];

async function run() {
  await connectDatabase();

  for (const { label, prompt } of testCases) {
    console.log(`\n=== ${label} ===`);
    console.log(`Prompt: "${prompt}"`);

    const decision = await routeMessage({ userPrompt: prompt, context: TEST_CONTEXT });

    console.log(`Intent: ${decision.intent} (confidence: ${decision.confidence})`);
    if (decision.intent === 'lookup') {
      console.log(`Tool: ${decision.targetTool}`);
      console.log(`Args: ${JSON.stringify(decision.toolArgs)}`);
      console.log(`Real result:`, decision.toolResult);
    } else if (decision.intent === 'navigate') {
      console.log(`Destination: ${decision.destination}`);
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
