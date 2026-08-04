// Reusable test script for Step 13's Tool Registry + tool calling.
// Requires a real GEMINI_API_KEY (Step 11) and a running MongoDB with
// the Steps 7/9/10 seed data already loaded (market prices, shops,
// schemes) - without that data, tools will correctly report
// { found: false } rather than a fabricated result, which is itself
// proof the "never hallucinate" guarantee holds even with an empty
// database.
//
// Usage: node scripts/test-tool-calling.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { classifyToolCall } from '../src/ai/gateway/index.js';
import { getToolDefinitions, executeTool } from '../src/ai/toolRegistry/index.js';

dotenv.config();

// A fixed test location (Mandya) - matches the default location used
// throughout the rest of this project's testing. Step 13 has no real
// session integration yet (that's a later step); this is exactly the
// "context injected separately from what Gemini extracts" design
// this step is built around.
const TEST_CONTEXT = { lat: 12.5242, lng: 76.8958 };

const testCases = [
  { label: 'Market price query', prompt: 'What is the price of onion today?' },
  { label: 'Weather query', prompt: 'Will it rain today?' },
  { label: 'Nearby shops query', prompt: 'Is there a shop nearby selling urea?' },
  { label: 'Government scheme query', prompt: 'Are there any schemes for irrigation subsidies?' },
  { label: 'Non-lookup query (should NOT call a tool)', prompt: 'Hello, how are you?' },
];

async function run() {
  await connectDatabase();
  const toolDefinitions = getToolDefinitions();

  for (const { label, prompt } of testCases) {
    console.log(`\n=== ${label} ===`);
    console.log(`Prompt: "${prompt}"`);

    const { toolCall, text, model } = await classifyToolCall({
      systemPrompt:
        'You are an agriculture assistant for Indian farmers. Use the available tools for factual lookups (prices, weather, shops, schemes). For greetings or general chat, respond with plain text and do not call a tool.',
      userPrompt: prompt,
      toolDefinitions,
    });

    console.log(`Model: ${model}`);

    if (toolCall) {
      console.log(`Tool selected: ${toolCall.name}`);
      console.log(`Arguments extracted: ${JSON.stringify(toolCall.args)}`);
      const result = await executeTool(toolCall.name, toolCall.args, TEST_CONTEXT);
      console.log(`Real result from domain service:`, result);
    } else {
      console.log(`No tool called - Gemini responded with text: "${text}"`);
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
