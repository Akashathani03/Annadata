import { mock } from 'node:test';
import assert from 'node:assert/strict';

let listingsStore = [];
let cropsStore = [];

function matchQuery(doc, dbQuery) {
  for (const [key, val] of Object.entries(dbQuery)) {
    if (val instanceof RegExp) {
      if (!val.test(doc[key] ?? '')) return false;
    } else if (val && typeof val === 'object' && '$lte' in val) {
      if (!(doc[key] <= val.$lte)) return false;
    } else if (doc[key] !== val) {
      return false;
    }
  }
  return true;
}

// Chainable object supporting both call patterns findAll uses:
// .sort().skip().limit() (non-radius path) and .sort() awaited
// directly (radius path, pagination happens in JS afterward).
function makeCursor(matches) {
  const sorted = [...matches]; // createdAt sort irrelevant to what these tests assert
  return {
    sort() {
      const chain = {
        skip(n) {
          return { limit: (m) => Promise.resolve(sorted.slice(n, n + m)) };
        },
        then(resolve) {
          resolve(sorted);
        },
      };
      return chain;
    },
  };
}

mock.module('../src/models/Listing.js', {
  namedExports: {
    Listing: {
      find(dbQuery) {
        return makeCursor(listingsStore.filter((l) => matchQuery(l, dbQuery)));
      },
      countDocuments(dbQuery) {
        return Promise.resolve(listingsStore.filter((l) => matchQuery(l, dbQuery)).length);
      },
    },
  },
  cache: false,
});

mock.module('../src/models/Crop.js', {
  namedExports: {
    Crop: {
      findById: (id) => Promise.resolve(cropsStore.find((c) => c._id === id) ?? null),
    },
  },
  cache: false,
});

const { getListings } = await import('../src/services/domain/listings/listings.service.js');

function reset() {
  listingsStore = [];
}

const BASE = { lat: 12.9716, lng: 77.5946 };
const NEAR = { lat: 12.9816, lng: 77.6046 }; // ~1.5km from BASE
const FAR = { lat: 13.5, lng: 78.2 }; // ~90km+ from BASE

cropsStore = [
  { _id: 'tractor', category: 'equipment' },
  { _id: 'tomato', category: 'crop' },
  { _id: 'cow', category: 'animal' },
];

let idCounter = 0;
function makeListing(overrides = {}) {
  idCounter++;
  const base = {
    id: `id${idCounter}`,
    ownerId: 'owner1',
    category: 'equipment',
    itemId: 'tractor',
    itemName: 'Test Tractor',
    price: 400000,
    status: 'published',
    condition: null,
    lat: NEAR.lat,
    lng: NEAR.lng,
    ...overrides,
  };
  base.toObject = () => ({ ...base });
  base._id = { toString: () => base.id };
  return base;
}

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
async function expectReject(name, fn) {
  try {
    await fn();
    console.log(`FAIL: ${name} - did not throw`);
    fail++;
  } catch (e) {
    if (e.statusCode === 400) {
      console.log(`PASS: ${name}`);
      pass++;
    } else {
      console.log(`FAIL: ${name} - wrong error: ${e.message}`);
      fail++;
    }
  }
}

reset();
listingsStore.push(makeListing());
await recordAsync('1. Equipment + tractor returns the listing', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor' });
  assert.equal(r.listings.length, 1);
});

await recordAsync('2. Equipment + tractor + radius (in range)', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', lat: BASE.lat, lng: BASE.lng, radiusKm: 5 });
  assert.equal(r.listings.length, 1);
});

await recordAsync('3a. priceMax above price includes', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', priceMax: 500000 });
  assert.equal(r.listings.length, 1);
});
await recordAsync('3b. priceMax below price excludes', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', priceMax: 100000 });
  assert.equal(r.listings.length, 0);
});

reset();
listingsStore.push(makeListing({ condition: 'used-good' }));
await recordAsync('4a. condition match included', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', condition: 'used-good' });
  assert.equal(r.listings.length, 1);
});
await recordAsync('4b. condition mismatch excluded', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', condition: 'new' });
  assert.equal(r.listings.length, 0);
});

await recordAsync('5. Combined radius + priceMax match', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', lat: BASE.lat, lng: BASE.lng, radiusKm: 5, priceMax: 500000 });
  assert.equal(r.listings.length, 1);
});

reset();
listingsStore.push(makeListing({ category: 'crop', itemId: 'tomato', condition: null }));
await recordAsync('6. Crop + valid itemId', async () => {
  const r = await getListings({ category: 'crop', itemId: 'tomato' });
  assert.equal(r.listings.length, 1);
});

reset();
listingsStore.push(makeListing({ category: 'animal', itemId: 'cow', condition: null }));
await recordAsync('7. Animal + valid itemId', async () => {
  const r = await getListings({ category: 'animal', itemId: 'cow' });
  assert.equal(r.listings.length, 1);
});

await expectReject('8. category=crop + itemId=tractor rejected', () =>
  getListings({ category: 'crop', itemId: 'tractor' })
);

reset();
listingsStore.push(makeListing({ status: 'draft' }));
listingsStore.push(makeListing({ status: 'closed' }));
listingsStore.push(makeListing({ status: 'published' }));
await recordAsync('9. Draft listing excluded', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor' });
  assert.equal(r.total, 1);
});
await recordAsync('10. Closed listing excluded', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor' });
  assert.equal(r.listings[0].status, 'published');
});

reset();
listingsStore.push(makeListing({ lat: NEAR.lat, lng: NEAR.lng }));
listingsStore.push(makeListing({ lat: FAR.lat, lng: FAR.lng }));
await recordAsync('11. Listing outside radius excluded', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', lat: BASE.lat, lng: BASE.lng, radiusKm: 10 });
  assert.equal(r.total, 1);
});
await recordAsync('12. Listing inside radius included', async () => {
  const r = await getListings({ category: 'equipment', itemId: 'tractor', lat: BASE.lat, lng: BASE.lng, radiusKm: 10 });
  assert.equal(r.listings.length, 1);
});

reset();
listingsStore.push(makeListing());
listingsStore.push(makeListing());
await recordAsync('13. Existing {category,page,limit} call shape still works', async () => {
  const r = await getListings({ category: 'equipment', page: 1, limit: 20 });
  assert.equal(r.listings.length, 2);
  assert.equal(r.page, 1);
  assert.equal(r.limit, 20);
});

await expectReject('radiusKm without lat/lng rejected', () =>
  getListings({ category: 'equipment', radiusKm: 5 })
);
await expectReject('negative radiusKm rejected', () =>
  getListings({ category: 'equipment', lat: 1, lng: 1, radiusKm: -5 })
);
await expectReject('negative priceMax rejected', () =>
  getListings({ category: 'equipment', priceMax: -100 })
);
await expectReject('invalid condition rejected', () =>
  getListings({ category: 'equipment', condition: 'brand-new-ish' })
);
await expectReject('invalid itemId for category rejected', () =>
  getListings({ category: 'equipment', itemId: 'nonexistent_item' })
);
await recordAsync('lat/lng missing without radiusKm does not throw', async () => {
  await getListings({ category: 'equipment' });
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
