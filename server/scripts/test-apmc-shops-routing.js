// Regression test for the market_price_lookup / nearby_shops_lookup
// description refinement. Covers the two exact phrasings that were
// misrouted before the fix, plus a spread of other real phrasings for
// both tools, to confirm this sharpened the distinction without
// breaking anything that was already working correctly.
//
// Usage: node scripts/test-apmc-shops-routing.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { routeMessage } from '../src/services/agroAI/intentRouter/index.js';

dotenv.config();

const TEST_CONTEXT = { lat: 12.5242, lng: 76.8958 };

const testCases = [
  // The two exact phrasings that were misrouted to nearby_shops_lookup before the fix
  { label: 'Originally failed #1', prompt: 'is APMC near to my location', expectedTool: 'market_price_lookup' },
  { label: 'Originally failed #2', prompt: 'what are my near APMC', expectedTool: 'market_price_lookup' },
  // Other phrasings of the same underlying question
  { label: 'APMC variant', prompt: 'which APMC is nearest to me', expectedTool: 'market_price_lookup' },
  { label: 'APMC variant', prompt: 'distance to my nearest mandi', expectedTool: 'market_price_lookup' },
  // Regression: plain price questions should still route correctly
  { label: 'Plain price question', prompt: 'What is the price of onion today?', expectedTool: 'market_price_lookup' },
  { label: 'Plain price question', prompt: 'how much does tomato sell for', expectedTool: 'market_price_lookup' },
  // Regression: genuine shop questions should still route correctly
  { label: 'Shop with product', prompt: 'Is there a shop nearby selling urea?', expectedTool: 'nearby_shops_lookup' },
  { label: 'Shop with product', prompt: 'where can I buy fertilizer near me', expectedTool: 'nearby_shops_lookup' },
  { label: 'Generic shop question', prompt: 'shops near me', expectedTool: 'nearby_shops_lookup' },
];

async function run() {
  await connectDatabase();

  let pass = 0;
  let fail = 0;

  for (const { label, prompt, expectedTool } of testCases) {
    const decision = await routeMessage({ userPrompt: prompt, context: TEST_CONTEXT });
    const actualTool = decision.intent === 'lookup' ? decision.targetTool : `(${decision.intent}, no tool)`;
    const ok = decision.intent === 'lookup' && decision.targetTool === expectedTool;

    console.log(`${ok ? 'PASS' : 'FAIL'}: [${label}] "${prompt}"`);
    console.log(`  expected: ${expectedTool} | actual: ${actualTool}`);

    if (ok) pass++;
    else fail++;
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});
