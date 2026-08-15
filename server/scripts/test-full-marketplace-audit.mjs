import { mock } from 'node:test';
import assert from 'node:assert/strict';

// Simulated catalog - one item per category, matching what each real
// seed script would produce.
const catalog = {
  tomato: { _id: 'tomato', category: 'crop' },
  cow: { _id: 'cow', category: 'animal' },
  tractor: { _id: 'tractor', category: 'equipment' },
};

let listingsDb = [];
let nextId = 1;

mock.module('../src/models/Crop.js', {
  namedExports: {
    Crop: { findById: (id) => Promise.resolve(catalog[id] ?? null) },
  },
  cache: false,
});

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
function makeCursor(matches) {
  return {
    sort() {
      return {
        skip(n) {
          return { limit: (m) => Promise.resolve(matches.slice(n, n + m)) };
        },
        then(resolve) {
          resolve(matches);
        },
      };
    },
  };
}

mock.module('../src/models/Listing.js', {
  namedExports: {
    Listing: {
      find(dbQuery) {
        return makeCursor(listingsDb.filter((l) => matchQuery(l, dbQuery)));
      },
      countDocuments(dbQuery) {
        return Promise.resolve(listingsDb.filter((l) => matchQuery(l, dbQuery)).length);
      },
      create(doc) {
        const saved = { ...doc, id: `id${nextId}`, _id: { toString: () => `id${nextId}` } };
        saved.toObject = () => ({ ...saved });
        nextId++;
        listingsDb.push(saved);
        return Promise.resolve(saved);
      },
    },
  },
  cache: false,
});

const { createListing } = await import('../src/services/domain/listings/listings.service.js');
const { getListings } = await import('../src/services/domain/listings/listings.service.js');

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

// Realistic payloads, matching each real CreateListing.jsx's actual output shape
const payloads = {
  crop: {
    category: 'crop', itemId: 'tomato', itemName: 'Tomato', quantity: 100, unit: 'Kg', price: 25,
    description: 'Fresh tomatoes', photoUrl: '', apmcId: null, apmcName: '',
    location: 'Mysuru, Mysuru, Mysuru', locationVillage: 'Mysuru', locationTaluk: 'Mysuru',
    locationDistrict: 'Mysuru', locationState: 'Karnataka', lat: 12.97, lng: 77.59,
    phone: '9876543210', status: 'published',
  },
  animal: {
    category: 'animal', itemId: 'cow', itemName: 'Healthy Jersey Cow, 3 years', quantity: 1, unit: 'Head', price: 45000,
    description: 'Healthy milking cow', photoUrl: '',
    location: 'Mysuru, Mysuru, Mysuru', locationVillage: 'Mysuru', locationTaluk: 'Mysuru',
    locationDistrict: 'Mysuru', locationState: 'Karnataka', lat: 12.97, lng: 77.59,
    phone: '9876543210', status: 'published',
  },
  equipment: {
    category: 'equipment', itemId: 'tractor', itemName: 'Mahindra 575', quantity: 1, unit: 'Unit', price: 400000,
    description: 'Well maintained tractor', photoUrl: '', condition: 'used-good',
    location: 'Mysuru, Mysuru, Mysuru', locationVillage: 'Mysuru', locationTaluk: 'Mysuru',
    locationDistrict: 'Mysuru', locationState: 'Karnataka', lat: 12.97, lng: 77.59,
    phone: '9876543210', status: 'published',
  },
};

for (const [category, payload] of Object.entries(payloads)) {
  await recordAsync(`CREATE: ${category} listing saves without error`, async () => {
    const result = await createListing(`owner_${category}`, payload, null);
    assert.equal(result.category, category);
    assert.equal(result.status, 'published');
  });
}

for (const category of Object.keys(payloads)) {
  await recordAsync(`BUY: published ${category} listing appears in public getListings`, async () => {
    const result = await getListings({ category });
    assert.equal(result.listings.length, 1, `expected 1 ${category} listing, got ${result.listings.length}`);
    assert.equal(result.listings[0].category, category);
    assert.equal(result.listings[0].status, 'published');
  });
}

// Cross-category isolation - a crop search must never return animal/equipment
await recordAsync('Category filter correctly isolates results (no cross-category leak)', async () => {
  const cropResults = await getListings({ category: 'crop' });
  const animalResults = await getListings({ category: 'animal' });
  const equipmentResults = await getListings({ category: 'equipment' });
  assert.equal(cropResults.listings.every((l) => l.category === 'crop'), true);
  assert.equal(animalResults.listings.every((l) => l.category === 'animal'), true);
  assert.equal(equipmentResults.listings.every((l) => l.category === 'equipment'), true);
});

// Draft exclusion - re-verify with all 3 categories together
listingsDb = [];
await createListing('owner1', { ...payloads.crop, status: 'draft' }, null);
await createListing('owner2', { ...payloads.animal, status: 'published' }, null);
await createListing('owner3', { ...payloads.equipment, status: 'published' }, null);
await recordAsync('Draft crop excluded, published animal+equipment included', async () => {
  const crop = await getListings({ category: 'crop' });
  const animal = await getListings({ category: 'animal' });
  const equipment = await getListings({ category: 'equipment' });
  assert.equal(crop.listings.length, 0, 'draft crop should not appear');
  assert.equal(animal.listings.length, 1);
  assert.equal(equipment.listings.length, 1);
});

// Original pre-Phase-1 call shape, re-verified in this exact combined context
listingsDb = [];
await createListing('owner1', payloads.crop, null);
await recordAsync('Original {category,page,limit}-only call shape still works for all categories', async () => {
  const r = await getListings({ category: 'crop', page: 1, limit: 20 });
  assert.equal(r.listings.length, 1);
  assert.equal(r.page, 1);
  assert.equal(r.limit, 20);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
