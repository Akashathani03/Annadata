import * as inMemoryRateLimitStore from './inMemoryRateLimitStore.js';

// Same pattern as src/storage/index.js: every consumer imports
// rateLimitProvider from here, never a specific implementation
// directly. Swapping to Redis later (if this ever runs across
// multiple instances) means adding a new provider file implementing
// the same consume(key, policy) -> { allowed, remaining, resetAt }
// contract and changing this one line - no route or middleware that
// already calls rateLimitProvider.consume() needs to change at all.
export const rateLimitProvider = inMemoryRateLimitStore;
