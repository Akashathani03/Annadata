import { mock } from 'node:test';
import assert from 'node:assert/strict';

let lastUpdateCall = null;
let existingListing = null;

mock.module('../src/repositories/crop.repository.js', {
  namedExports: {
    findById: (id) => Promise.resolve(id === 'tractor' ? { _id: 'tractor', category: 'equipment' } : null),
  },
  cache: false,
});

mock.module('../src/repositories/listing.repository.js', {
  namedExports: {
    findById: (id) => Promise.resolve(id === '507f1f77bcf86cd799439011' ? existingListing : null),
    update: (id, patch) => {
      lastUpdateCall = patch;
      const updated = { ...existingListing, ...patch };
      updated._id = { toString: () => id };
      updated.toObject = () => ({ ...updated });
      return Promise.resolve(updated);
    },
  },
  cache: false,
});

mock.module('../src/repositories/user.repository.js', { namedExports: {}, cache: false });
mock.module('../src/storage/index.js', { namedExports: { storageProvider: {} }, cache: false });

const { updateListing } = await import('../src/services/domain/listings/listings.service.js');

function resetListing(overrides = {}) {
  existingListing = {
    id: '507f1f77bcf86cd799439011',
    ownerId: { toString: () => 'owner1' },
    category: 'equipment',
    itemId: 'tractor',
    itemName: 'Mahindra 575',
    quantity: 1,
    unit: 'Unit',
    price: 400000,
    condition: 'used-good',
    status: 'draft',
    views: 0,
    lat: null,
    lng: null,
    ...overrides,
  };
  lastUpdateCall = null;
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

// 1. Normal PATCH with allowed fields succeeds
resetListing();
await recordAsync('1. Normal PATCH with allowed fields (price) succeeds', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 450000 });
  assert.equal(lastUpdateCall.price, 450000);
});

// 2. PATCH with ownerId -> ownerId not forwarded to update
resetListing();
await recordAsync('2. PATCH with ownerId -> ownerId not in update call', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 450000, ownerId: 'attacker_id' });
  assert.equal('ownerId' in lastUpdateCall, false);
});

// 3. PATCH with status -> status not forwarded
resetListing();
await recordAsync('3. PATCH with status -> status not in update call', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 450000, status: 'published' });
  assert.equal('status' in lastUpdateCall, false);
});

// 4. PATCH with views -> views not forwarded
resetListing();
await recordAsync('4. PATCH with views -> views not in update call', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { views: 99999 });
  assert.equal('views' in lastUpdateCall, false);
});

// 5. PATCH with soldAt -> not forwarded
resetListing();
await recordAsync('5. PATCH with soldAt -> not in update call', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 1, soldAt: new Date().toISOString() });
  assert.equal('soldAt' in lastUpdateCall, false);
});

// 6. PATCH with buyerId -> not forwarded
resetListing();
await recordAsync('6. PATCH with buyerId -> not in update call', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 1, buyerId: 'someone' });
  assert.equal('buyerId' in lastUpdateCall, false);
});

// 7. PATCH with saleAmount -> not forwarded
resetListing();
await recordAsync('7. PATCH with saleAmount -> not in update call', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 1, saleAmount: 999999 });
  assert.equal('saleAmount' in lastUpdateCall, false);
});

// 8. PATCH with an arbitrary unknown field -> not stored
resetListing();
await recordAsync('8. Arbitrary unknown field is dropped', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 1, isAdmin: true, hackField: 'x' });
  assert.equal('isAdmin' in lastUpdateCall, false);
  assert.equal('hackField' in lastUpdateCall, false);
});

// 9. Existing owner authorization still works
resetListing();
await recordAsync('9. Owner can still update their own listing', async () => {
  const result = await updateListing('owner1', '507f1f77bcf86cd799439011', { price: 999 });
  assert.equal(result.price, 999);
});

// 10. Another farmer cannot update the listing
resetListing();
await recordAsync('10. Non-owner is rejected (404, not exposing existence)', async () => {
  try {
    await updateListing('attacker', '507f1f77bcf86cd799439011', { price: 1 });
    throw new Error('should have thrown');
  } catch (e) {
    assert.equal(e.statusCode, 404);
  }
});

// Bonus: _id/createdAt/updatedAt/category also excluded
resetListing();
await recordAsync('Bonus: _id/createdAt/updatedAt/category also never forwarded', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', {
    price: 1, _id: 'fake', createdAt: 'x', updatedAt: 'x', category: 'crop',
  });
  assert.equal('_id' in lastUpdateCall, false);
  assert.equal('createdAt' in lastUpdateCall, false);
  assert.equal('updatedAt' in lastUpdateCall, false);
  assert.equal('category' in lastUpdateCall, false);
});

// Bonus: legitimate location fields (real schema names) still work
resetListing();
await recordAsync('Bonus: legitimate locationVillage/Taluk/District/State still editable', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', {
    locationVillage: 'X', locationTaluk: 'Y', locationDistrict: 'Z', locationState: 'Karnataka',
  });
  assert.equal(lastUpdateCall.locationVillage, 'X');
  assert.equal(lastUpdateCall.locationState, 'Karnataka');
});

// Bonus: lat/lng still editable via PATCH (whitelisted)
resetListing();
await recordAsync('Bonus: lat/lng still editable via PATCH', async () => {
  await updateListing('owner1', '507f1f77bcf86cd799439011', { lat: 12.97, lng: 77.59 });
  assert.equal(lastUpdateCall.lat, 12.97);
  assert.equal(lastUpdateCall.lng, 77.59);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
