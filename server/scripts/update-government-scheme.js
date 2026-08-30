// Records a human's manual check of one scheme's real official page -
// there is no machine-readable government API/dataset for scheme
// eligibility/deadlines/amounts (checked directly against data.gov.in
// and myscheme.gov.in; neither offers one), so unlike Agmarknet's
// automated price sync, this is a deliberately manual step. Run this
// only after actually reading the scheme's officialUrl and confirming
// the values you're entering - never as a way to bulk-refresh dates
// without checking them.
//
// Sets source: 'verified' and lastVerifiedAt: now on the given scheme,
// alongside whichever fields you pass. A field left out is left
// untouched, not cleared - pass an explicit '' to intentionally blank
// one out (e.g. a deadline that turned out to no longer exist).
//
// Usage:
//   node scripts/update-government-scheme.js <schemeId> [field=value ...]
//
// Example:
//   node scripts/update-government-scheme.js pmfby \
//     status=closing \
//     deadline="31 Jul 2026" \
//     detailDeadline="Enrollment closes 31 Jul 2026 for Kharif 2026"
//
// Valid fields: title, dept, scope, status, description,
// detailDescription, amount, detailAmount, deadline, detailDeadline,
// officialUrl. eligibility is not settable here (it's an array - edit
// it directly in MongoDB or extend this script if that's ever needed).

import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../src/config/database.js';
import { GovernmentScheme } from '../src/models/GovernmentScheme.js';
import mongoose from 'mongoose';

const SETTABLE_FIELDS = [
  'title',
  'dept',
  'scope',
  'status',
  'description',
  'detailDescription',
  'amount',
  'detailAmount',
  'deadline',
  'detailDeadline',
  'officialUrl',
];

async function run() {
  const [schemeId, ...pairs] = process.argv.slice(2);

  if (!schemeId) {
    console.error('Usage: node scripts/update-government-scheme.js <schemeId> [field=value ...]');
    process.exit(1);
  }

  const patch = {};
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) {
      console.error(`Ignoring malformed argument (expected field=value): ${pair}`);
      continue;
    }
    const field = pair.slice(0, eqIndex);
    const value = pair.slice(eqIndex + 1);
    if (!SETTABLE_FIELDS.includes(field)) {
      console.error(`Unknown field "${field}" - valid fields: ${SETTABLE_FIELDS.join(', ')}`);
      process.exit(1);
    }
    patch[field] = value;
  }

  await connectDatabase();

  const scheme = await GovernmentScheme.findById(schemeId);
  if (!scheme) {
    console.error(`No scheme found with id "${schemeId}"`);
    process.exit(1);
  }

  Object.assign(scheme, patch, { source: 'verified', lastVerifiedAt: new Date() });
  await scheme.save();

  console.log(`Verified "${scheme.title}" (${schemeId}) as of ${scheme.lastVerifiedAt.toISOString()}`);
  if (Object.keys(patch).length > 0) {
    console.log('Updated fields:', patch);
  } else {
    console.log('No fields changed - only marked as freshly verified.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
