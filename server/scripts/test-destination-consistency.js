// Automated consistency check between the backend's stable navigation
// destination identifiers (the source of truth for what's valid) and
// the frontend's independent destination-to-route mapping (Design B,
// Step 17). There's no shared module system between the two projects
// (confirmed elsewhere in this codebase - the geo-distance formula and
// crop catalog are each duplicated for the same reason), so this reads
// the frontend's source file directly by relative path rather than
// relying on a one-off manual check that won't catch future drift.
//
// Assumes the standard server/client sibling layout. Run this after
// any change to either destinations.js or agroAINavigation.js, or
// wire it into CI if one exists.
//
// Usage: node scripts/test-destination-consistency.js

import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { VALID_DESTINATIONS } from '../src/services/agroAI/intentRouter/destinations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_NAV_FILE = path.resolve(__dirname, '../../client/src/config/agroAINavigation.js');

async function run() {
  if (!fs.existsSync(FRONTEND_NAV_FILE)) {
    console.error(`Could not find the frontend's navigation config at:\n  ${FRONTEND_NAV_FILE}`);
    console.error('This script assumes the standard server/client sibling folder layout - adjust FRONTEND_NAV_FILE if your layout differs.');
    process.exit(1);
  }

  const { DESTINATION_ROUTES } = await import(pathToFileURL(FRONTEND_NAV_FILE).href);
  const frontendDestinations = Object.keys(DESTINATION_ROUTES);

  const backendSet = new Set(VALID_DESTINATIONS);
  const frontendSet = new Set(frontendDestinations);

  const missingFromFrontend = VALID_DESTINATIONS.filter((d) => !frontendSet.has(d));
  const missingFromBackend = frontendDestinations.filter((d) => !backendSet.has(d));

  console.log(`Backend destinations (${VALID_DESTINATIONS.length}):`, VALID_DESTINATIONS.sort());
  console.log(`Frontend destinations (${frontendDestinations.length}):`, frontendDestinations.sort());

  if (missingFromFrontend.length === 0 && missingFromBackend.length === 0) {
    console.log('\nPASS: backend and frontend destination identifiers are perfectly in sync.');
    process.exit(0);
  }

  console.error('\nFAIL: backend and frontend destination identifiers have drifted apart.');
  if (missingFromFrontend.length > 0) {
    console.error(`  Backend defines these, but the frontend has no route for them: ${missingFromFrontend.join(', ')}`);
    console.error('  -> A navigate reply with one of these would silently do nothing on tap.');
  }
  if (missingFromBackend.length > 0) {
    console.error(`  Frontend maps these, but the backend never validates or produces them: ${missingFromBackend.join(', ')}`);
    console.error('  -> Dead routes in the frontend mapping - harmless, but worth cleaning up.');
  }
  process.exit(1);
}

run().catch((err) => {
  console.error('Consistency check failed to run:', err);
  process.exit(1);
});
