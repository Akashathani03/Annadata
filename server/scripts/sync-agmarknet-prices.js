// One-off/cron-invoked run of the Agmarknet price sync - the same
// function server.js runs automatically on a recurring schedule (see
// its own comment), exposed standalone for manual runs or an external
// cron/scheduler that would rather manage timing itself.
//
// Usage: node scripts/sync-agmarknet-prices.js

import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../src/config/database.js';
import { syncAgmarknetPrices } from '../src/services/domain/marketPrices/agmarknetSync.service.js';

async function run() {
  await connectDatabase();
  const result = await syncAgmarknetPrices();
  console.log('Agmarknet sync result:', result);
  process.exit(0);
}

run().catch((err) => {
  console.error('Agmarknet sync failed:', err);
  process.exit(1);
});
