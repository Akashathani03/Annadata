// Dev/testing tool only - NOT part of the running application, never
// imported by src/. This exists because there's no real login/OTP
// endpoint yet to obtain a genuine token from (see Step 2's notes on
// the auth-issuance gap). Once a real login endpoint exists, this
// script stays useful for local testing/debugging without needing a
// full OTP round-trip every time.
//
// Usage: node scripts/generate-test-token.js [userId]

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env first.');
  process.exit(1);
}

const userId = process.argv[2] || 'test-user-id';

const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

console.log(token);
