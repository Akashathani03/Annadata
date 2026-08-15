import { mock } from 'node:test';
import assert from 'node:assert/strict';

let lastUpsertPatch = null;

mock.module('../src/repositories/shop.repository.js', {
  namedExports: {
    upsertByOwnerId: (ownerId, patch) => {
      lastUpsertPatch = patch;
      return Promise.resolve({ ...patch, ownerId });
    },
  },
  cache: false,
});
mock.module('../src/storage/index.js', { namedExports: { storageProvider: {} }, cache: false });

const { saveShop } = await import('../src/services/domain/shops/shops.service.js');

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

await recordAsync('1. Empty phone rejected with a clear validation error', async () => {
  try {
    await saveShop('owner1', { shopName: 'Test', phone: '' }, null);
    throw new Error('should have thrown');
  } catch (e) {
    assert.equal(e.statusCode, 400);
    assert.equal(e.code, 'VALIDATION_ERROR');
  }
});

await recordAsync('2. Missing phone field entirely also rejected', async () => {
  try {
    await saveShop('owner1', { shopName: 'Test' }, null);
    throw new Error('should have thrown');
  } catch (e) {
    assert.equal(e.statusCode, 400);
  }
});

await recordAsync('3. Whitespace-only phone rejected (not just literally empty)', async () => {
  try {
    await saveShop('owner1', { shopName: 'Test', phone: '   ' }, null);
    throw new Error('should have thrown');
  } catch (e) {
    assert.equal(e.statusCode, 400);
  }
});

await recordAsync('4. Valid phone saves successfully', async () => {
  const result = await saveShop('owner1', { shopName: 'Test', phone: '9876543210' }, null);
  assert.equal(result.phone, '9876543210');
  assert.equal(lastUpsertPatch.phone, '9876543210');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
