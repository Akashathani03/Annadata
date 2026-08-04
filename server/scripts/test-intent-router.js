// Reusable test script for Step 14's Intent Router. Requires a real
// GEMINI_API_KEY (Step 11) and a running MongoDB with the Steps
// 7/9/10 seed data loaded, same as test-tool-calling.js.
//
// Usage: node scripts/test-intent-router.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { routeMessage } from '../src/services/agroAI/intentRouter/index.js';

dotenv.config();

const TEST_CONTEXT = { lat: 12.5242, lng: 76.8958 };

const testCases = [
  { label: 'Lookup', prompt: 'What is the price of onion today?' },
  { label: 'Generate (diagnosis)', prompt: 'My tomato leaves have yellow spots and are wilting, what is wrong?' },
  { label: 'Generate (general guidance)', prompt: 'When is the best time to sow ragi in Karnataka?' },
  { label: 'Navigate', prompt: 'Take me to the page where I can sell my crops' },
  { label: 'Out of scope', prompt: 'Hello, how are you today?' },
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
    } else if (decision.intent === 'generate') {
      console.log(`Generation type: ${decision.generationType}`);
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
