import assert from 'node:assert/strict';
import { buildLookupReply } from '../src/services/agroAI/conversation/replyBuilder.js';

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

// Mirrors the exact shape executeMarketPriceLookup returns: the real
// getCropPriceDetail fields PLUS the synthetic recentHistory that
// buildRecentHistory (marketPrices.service.js) still generates for
// CropDetail.jsx's unrelated, legitimate use - proving the reply
// builder no longer derives a fabricated trend from it even though
// it's still present on the tool result.
const toolResult = {
  found: true,
  crop: { name: 'Tomato', defaultUnit: 'Quintal' },
  apmc: { name: 'Mandya APMC', district: 'Mandya' },
  minPrice: 1800,
  modalPrice: 2200,
  maxPrice: 2600,
  priceDate: '2026-08-05',
  recentHistory: [
    { date: '2026-08-11', minPrice: 1800, modalPrice: 2200, maxPrice: 2600 },
    { date: '2026-08-10', minPrice: 1764, modalPrice: 2156, maxPrice: 2548 },
    { date: '2026-08-09', minPrice: 1728, modalPrice: 2112, maxPrice: 2496 },
  ],
};

const reply = buildLookupReply('market_price_lookup', toolResult);

record('1. No trend field present at all in cardData', () => {
  assert.equal('trend' in reply.cardData, false);
});

record('2. cardData.trend is undefined (not "up", not any fabricated value)', () => {
  assert.equal(reply.cardData.trend, undefined);
});

record('3. Real current price (modalPrice) is unchanged', () => {
  assert.equal(reply.cardData.currentPrice, 2200);
});

record('4. Real minPrice is unchanged', () => {
  assert.equal(reply.cardData.minPrice, 1800);
});

record('5. Real maxPrice is unchanged', () => {
  assert.equal(reply.cardData.maxPrice, 2600);
});

record('6. Real priceDate is unchanged', () => {
  assert.equal(reply.cardData.lastUpdated, '2026-08-05');
});

record('7. Crop name and market name are unchanged', () => {
  assert.equal(reply.cardData.cropName, 'Tomato');
  assert.equal(reply.cardData.marketName, 'Mandya APMC');
});

record('8. Card type is still the correct marketPrice card', () => {
  assert.equal(reply.cardType, 'marketPrice');
  assert.equal(reply.type, 'card');
});

record('9. Not-found path is unaffected by this change', () => {
  const notFound = buildLookupReply('market_price_lookup', { found: false, reason: 'crop_not_recognized' });
  assert.equal(notFound.type, 'text');
  assert.equal(notFound.cardType, null);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
