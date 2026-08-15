import { mock } from 'node:test';
import assert from 'node:assert/strict';

// --- Fakes for the underlying model/service calls tools.js depends
// on. Everything else - tools.js's own resolveItemId/executeMarketplaceSearch,
// crop.repository.js's real searchByNameAndCategory, and
// replyBuilder.js's real buildMarketplaceSearchReply - is the actual,
// unmodified source.
let cropsStore = [
  { _id: 'tractor', name: 'Tractor', kannadaName: 'ಟ್ರ್ಯಾಕ್ಟರ್', category: 'equipment' },
  { _id: 'tomato', name: 'Tomato', kannadaName: 'ಟೊಮ್ಯಾಟೊ', category: 'crop' },
  { _id: 'cow', name: 'Cow', kannadaName: 'ಹಸು', category: 'animal' },
];

mock.module('../src/models/Crop.js', {
  namedExports: {
    Crop: {
      find({ category, $or }) {
        const [{ name: nameRegex }] = $or;
        return Promise.resolve(
          cropsStore.filter((c) => c.category === category && (nameRegex.test(c.name) || nameRegex.test(c.kannadaName)))
        );
      },
    },
  },
  cache: false,
});

let listingsResponse = { listings: [], total: 0, page: 1, limit: 10 };
let lastGetListingsCall = null;
let getListingsShouldThrow = null;

mock.module('../src/services/domain/listings/listings.service.js', {
  namedExports: {
    getListings: async (params) => {
      lastGetListingsCall = params;
      if (getListingsShouldThrow) {
        const err = getListingsShouldThrow;
        getListingsShouldThrow = null;
        throw err;
      }
      return listingsResponse;
    },
  },
  cache: false,
});

const { tools } = await import('../src/ai/toolRegistry/tools.js');
const { buildLookupReply } = await import('../src/services/agroAI/conversation/replyBuilder.js');
const { ROUTING_RESPONSE_SCHEMA } = await import('../src/services/agroAI/intentRouter/routingSchema.js');

const searchTool = tools.find((t) => t.name === 'search_marketplace_listings');

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

function makeListing(overrides = {}) {
  return {
    id: 'l1',
    itemName: 'Mahindra 575',
    itemId: 'tractor',
    category: 'equipment',
    price: 400000,
    condition: 'used-good',
    location: 'Mysuru',
    lat: 12.98,
    lng: 77.6,
    ownerId: 'owner1',
    phone: '9876543210',
    status: 'published',
    ...overrides,
  };
}

// Phase 3 requires location for every search (a deliberate, explicit
// spec change from Phase 1/2's "search anyway without a radius"
// behavior) - every test below that expects a real search to happen
// now passes this context.
const HERE = { lat: 12.97, lng: 77.59 };

// 1. "tractor" -> equipment + tractor
listingsResponse = { listings: [makeListing()], total: 1, page: 1, limit: 10 };
await recordAsync('1. "tractor" resolves to equipment/tractor', async () => {
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'tractor' }, HERE);
  assert.equal(lastGetListingsCall.itemId, 'tractor');
  assert.equal(lastGetListingsCall.category, 'equipment');
  assert.equal(r.found, true);
});

// 2. "tractors near me" -> plural + location
await recordAsync('2. "tractors" (plural) resolves, location applied', async () => {
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'tractors' }, HERE);
  assert.equal(lastGetListingsCall.itemId, 'tractor');
  assert.equal(lastGetListingsCall.radiusKm, 25);
  assert.equal(lastGetListingsCall.lat, 12.97);
  assert.equal(r.listings[0].distanceKm != null, true, 'distanceKm should be computed');
});

// 3. "used tractor near me" -> condition + location
await recordAsync('3. "used tractor" applies condition + location', async () => {
  await searchTool.execute({ category: 'equipment', itemQuery: 'tractor', condition: 'used-good' }, HERE);
  assert.equal(lastGetListingsCall.condition, 'used-good');
  assert.equal(lastGetListingsCall.radiusKm, 25);
});

// 4. "tractor under 5 lakh" -> priceMax
await recordAsync('4. priceMax passed through correctly', async () => {
  await searchTool.execute({ category: 'equipment', itemQuery: 'tractor', priceMax: 500000 }, HERE);
  assert.equal(lastGetListingsCall.priceMax, 500000);
});

// 5. all filters combined
await recordAsync('5. condition + priceMax + location combined', async () => {
  await searchTool.execute(
    { category: 'equipment', itemQuery: 'tractor', condition: 'used-good', priceMax: 500000 },
    HERE
  );
  assert.equal(lastGetListingsCall.condition, 'used-good');
  assert.equal(lastGetListingsCall.priceMax, 500000);
  assert.equal(lastGetListingsCall.radiusKm, 25);
});

// 6. crop item search
await recordAsync('6. crop item search resolves correctly', async () => {
  await searchTool.execute({ category: 'crop', itemQuery: 'tomato' }, HERE);
  assert.equal(lastGetListingsCall.itemId, 'tomato');
  assert.equal(lastGetListingsCall.category, 'crop');
});

// 7. animal item search
await recordAsync('7. animal item search resolves correctly', async () => {
  await searchTool.execute({ category: 'animal', itemQuery: 'cow' }, HERE);
  assert.equal(lastGetListingsCall.itemId, 'cow');
  assert.equal(lastGetListingsCall.category, 'animal');
});

// 8. unknown item - checked with location present, so item recognition
// (not location) is what's actually being isolated here
await recordAsync('8. unknown item returns item_not_recognized, never calls getListings', async () => {
  lastGetListingsCall = null;
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'flying carpet' }, HERE);
  assert.equal(r.found, false);
  assert.equal(r.reason, 'item_not_recognized');
  assert.equal(lastGetListingsCall, null);
});

// 9. no location available - Phase 3's new, explicit requirement:
// Agro AI must ask for location rather than search unbounded.
await recordAsync('9. no location -> location_unavailable, never calls getListings', async () => {
  lastGetListingsCall = null;
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'tractor' }, {});
  assert.equal(r.found, false);
  assert.equal(r.reason, 'location_unavailable');
  assert.equal(lastGetListingsCall, null, 'must not search at all without location');
});

await recordAsync('9b. partial location (lat only) still treated as unavailable', async () => {
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'tractor' }, { lat: 12.97 });
  assert.equal(r.found, false);
  assert.equal(r.reason, 'location_unavailable');
});

// 10. zero matching listings
listingsResponse = { listings: [], total: 0, page: 1, limit: 10 };
await recordAsync('10. zero listings -> found:false, listings:[]', async () => {
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'tractor' }, HERE);
  assert.equal(r.found, false);
  assert.deepEqual(r.listings, []);
});

// 11. multiple matching listings (capped at 5)
listingsResponse = { listings: Array.from({ length: 8 }, (_, i) => makeListing({ id: `l${i}` })), total: 8, page: 1, limit: 10 };
await recordAsync('11. multiple listings capped at 5', async () => {
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'tractor' }, HERE);
  assert.equal(r.listings.length, 5);
});

// 12. only published listings returned - verified structurally: the
// tool always calls the real getListings, which Phase 1 already
// proved hardcodes status:'published' regardless of caller input.
await recordAsync('12. tool never passes a status override to getListings', async () => {
  await searchTool.execute({ category: 'equipment', itemQuery: 'tractor' }, HERE);
  assert.equal('status' in lastGetListingsCall, false, 'tool must never attempt to set status itself');
});

// 13. invalid category - checked before location, so it correctly
// short-circuits regardless of context
await recordAsync('13. invalid category rejected before any search', async () => {
  lastGetListingsCall = null;
  const r = await searchTool.execute({ category: 'vehicles' }, HERE);
  assert.equal(r.found, false);
  assert.equal(r.reason, 'invalid_category');
  assert.equal(lastGetListingsCall, null);
});

// 14. invalid condition - simulate getListings rejecting it (Phase 1's real validator would)
await recordAsync('14. invalid condition from getListings degrades to safe not-found', async () => {
  const { ApiError } = await import('../src/utils/ApiError.js');
  getListingsShouldThrow = new ApiError(400, 'VALIDATION_ERROR', 'condition must be one of new, used-good, used-fair.');
  const r = await searchTool.execute({ category: 'equipment', itemQuery: 'tractor', condition: 'brand-new-ish' }, HERE);
  assert.equal(r.found, false);
  assert.equal(r.reason, 'search_error');
});

// 15. location passed from context, not LLM arguments - static check
// of the tool's own declared parameter schema.
await recordAsync('15. tool schema never declares lat/lng as an LLM-extractable argument', async () => {
  const paramNames = Object.keys(searchTool.parameters.properties);
  assert.equal(paramNames.includes('lat'), false);
  assert.equal(paramNames.includes('lng'), false);
});

await recordAsync('Routing schema toolArgs never declares lat/lng', async () => {
  const toolArgsProps = Object.keys(ROUTING_RESPONSE_SCHEMA.properties.toolArgs.properties);
  assert.equal(toolArgsProps.includes('lat'), false);
  assert.equal(toolArgsProps.includes('lng'), false);
  assert.equal(toolArgsProps.includes('category'), true);
  assert.equal(toolArgsProps.includes('itemQuery'), true);
});

// Reply builder checks - Phase 3: found results now produce a real card
await recordAsync('replyBuilder: found result produces a marketplaceListing card, never mentions phone/ownerId', async () => {
  const reply = buildLookupReply('search_marketplace_listings', {
    found: true,
    listings: [makeListing({ distanceKm: 4.2 })],
  });
  assert.equal(reply.type, 'card');
  assert.equal(reply.cardType, 'marketplaceListing');
  assert.equal(reply.cardData.listings.length, 1);
  assert.equal(reply.cardData.listings[0].itemName, 'Mahindra 575');
  assert.equal(reply.cardData.listings[0].distanceKm, 4.2);
  assert.equal('phone' in reply.cardData.listings[0], false);
  assert.equal('ownerId' in reply.cardData.listings[0], false);
});

await recordAsync('replyBuilder: not-found never invents a listing', async () => {
  const reply = buildLookupReply('search_marketplace_listings', { found: false, listings: [] });
  assert.equal(reply.cardType, null);
  assert.equal(reply.text.toLowerCase().includes('no matching'), true);
});

await recordAsync('replyBuilder: item_not_recognized gives an honest message', async () => {
  const reply = buildLookupReply('search_marketplace_listings', { found: false, reason: 'item_not_recognized' });
  assert.equal(reply.text.toLowerCase().includes("couldn't recognize"), true);
});

await recordAsync('replyBuilder: location_unavailable asks for location, does not guess', async () => {
  const reply = buildLookupReply('search_marketplace_listings', { found: false, reason: 'location_unavailable' });
  assert.equal(reply.cardType, null);
  assert.equal(reply.text.toLowerCase().includes('location'), true);
});

// --- Regression: the 4 pre-existing tools must still work unchanged ---
await recordAsync('REGRESSION: all 4 existing tools still registered', async () => {
  const names = tools.map((t) => t.name);
  assert.equal(names.includes('market_price_lookup'), true);
  assert.equal(names.includes('weather_lookup'), true);
  assert.equal(names.includes('nearby_shops_lookup'), true);
  assert.equal(names.includes('government_scheme_lookup'), true);
  assert.equal(tools.length, 5, 'exactly 5 tools now (4 existing + 1 new)');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
