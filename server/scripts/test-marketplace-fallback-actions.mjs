import assert from 'node:assert/strict';
import { buildLookupReply } from '../src/services/agroAI/conversation/replyBuilder.js';

// Pure functions, real source, no mocking needed - buildLookupReply is
// the only public entry point (buildMarketPriceReply/buildShopsReply/
// buildMarketplaceSearchReply are private), so every case below goes
// through it exactly as conversation.service.js does.

let pass = 0, fail = 0;
function record(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    pass++;
  } catch (e) {
    console.log(`FAIL: ${name} - ${e.message}`);
    fail++;
  }
}

record('market price not-found includes a MARKET_PRICES navigate action', () => {
  const reply = buildLookupReply('market_price_lookup', { found: false });
  assert.equal(reply.type, 'text');
  assert.deepEqual(reply.action, { type: 'navigate', destination: 'MARKET_PRICES' });
});

record('market price found (no action expected/needed) has no action field forced on it', () => {
  const reply = buildLookupReply('market_price_lookup', {
    found: true,
    crop: { name: 'Onion', defaultUnit: 'Kg' },
    apmc: { name: 'Mysuru APMC', district: 'Mysuru' },
    minPrice: 10, modalPrice: 12, maxPrice: 15, priceDate: '2026-01-01',
  });
  assert.equal(reply.type, 'card');
  assert.equal(reply.action, undefined);
});

record('nearby shops not-found includes a NEAR_SHOPS navigate action', () => {
  const reply = buildLookupReply('nearby_shops_lookup', { found: false, shops: [] });
  assert.deepEqual(reply.action, { type: 'navigate', destination: 'NEAR_SHOPS' });
});

record('marketplace search not-found (crop) routes to BUY_CROP', () => {
  const reply = buildLookupReply('search_marketplace_listings', { found: false, category: 'crop', listings: [] });
  assert.deepEqual(reply.action, { type: 'navigate', destination: 'BUY_CROP' });
  assert.equal(reply.text.includes('crop'), true, 'expected category-specific text');
});

record('marketplace search not-found (animal) routes to BUY_ANIMAL', () => {
  const reply = buildLookupReply('search_marketplace_listings', { found: false, category: 'animal', listings: [] });
  assert.deepEqual(reply.action, { type: 'navigate', destination: 'BUY_ANIMAL' });
});

record('marketplace search not-found (equipment) routes to BUY_EQUIPMENT', () => {
  const reply = buildLookupReply('search_marketplace_listings', { found: false, category: 'equipment', listings: [] });
  assert.deepEqual(reply.action, { type: 'navigate', destination: 'BUY_EQUIPMENT' });
});

record('marketplace search location_unavailable stays a plain text message, no action', () => {
  const reply = buildLookupReply('search_marketplace_listings', { reason: 'location_unavailable' });
  assert.equal(reply.action, undefined);
});

record('marketplace search found: at most 3 listings in the card, never more', () => {
  const listings = Array.from({ length: 5 }, (_, i) => ({ id: `l${i}`, category: 'crop', itemName: `Item ${i}` }));
  const reply = buildLookupReply('search_marketplace_listings', { found: true, category: 'crop', listings });
  assert.equal(reply.cardData.listings.length, 3);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
