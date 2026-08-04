# Rate Limiting (Step 19)

Backend request protection - implemented as a pluggable, swappable abstraction with an in-memory store for now, and a documented, direct path to a Redis-backed store later without changing any route.

## Architecture

```
route file
  -> rateLimit('CATEGORY')         (src/middleware/rateLimit.middleware.js)
    -> rateLimitProvider.consume() (src/rateLimit/index.js)
      -> inMemoryRateLimitStore    (src/rateLimit/inMemoryRateLimitStore.js)
```

Every route imports `rateLimit` from the middleware file, never the store directly. The middleware imports `rateLimitProvider` from `src/rateLimit/index.js`, never a specific implementation. This mirrors the exact pattern already established for file storage (`src/storage/index.js` / `storageProvider`) - one file decides which concrete implementation is active; nothing else needs to know or change when that decision changes.

## Algorithm

Fixed-window counter: each key gets a count and a window start time. A request within the current window increments the count; once the window expires, the next request starts a fresh window. This is deliberately the same algorithm Redis's own `INCR` + `EXPIRE` pattern implements - a future Redis provider is a direct mapping onto this same contract, not a redesign.

## Keying

- **Authenticated routes**: `user:{userId}:{category}` - `requireAuth` must run before `rateLimit(...)` in the route's middleware chain so `req.user.id` is populated. This means a user is limited as themselves, not lumped in with everyone else on the same IP (relevant for farmers behind a shared mobile carrier NAT).
- **Unauthenticated routes** (OTP send/verify - the one part of the API that's intentionally public): `ip:{req.ip}:{category}`.

Each category is tracked independently per key - hitting the `AI_REPLY` limit doesn't affect a user's `PROFILE_UPDATE` limit, and vice versa.

## Current policies

Defined in `src/rateLimit/policies.js` - one place to change any limit, never scattered inline.

| Category | Limit | Window | Applied to | Rationale |
|---|---|---|---|---|
| `AUTHENTICATION` | 5 | 1 min | `POST /auth/otp/send`, `POST /auth/otp/verify` | Tightest overall - brute-force protection, IP-based since no user exists yet |
| `AI_REPLY` | 20 | 1 min | `POST /agro-ai/messages/:id/reply` | Real Gemini API calls, real cost per request - the most expensive endpoint in the backend |
| `IMAGE_UPLOAD` | 10 | 1 min | `POST /agro-ai/messages`, `PUT /shops/me` | Any endpoint accepting a file upload |
| `PROFILE_UPDATE` | 10 | 1 min | `PATCH /users/me` | |
| `GENERAL_API` | 100 | 1 min | Mounted globally in `app.js` as a backstop for every route below `health`/`whoami` | Broad, generous - a safety net for anything without its own tighter category |

`health` and `whoami` are deliberately exempt (diagnostic routes, not farmer-facing).

## Response shape on limit exceeded

Standard `429`, same envelope as every other error in this backend:

```json
{
  "success": false,
  "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Too many requests. Please wait a moment and try again." }
}
```

Every response (allowed or not) carries three headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1785828022   (unix seconds when the current window resets)
```

## How to change a limit

Edit the relevant entry in `src/rateLimit/policies.js`. No route code, no middleware, no store code needs to change.

## How to add a new category

1. Add an entry to `RATE_LIMIT_POLICIES` in `policies.js`.
2. Apply `rateLimit('YOUR_CATEGORY')` in the relevant route file's middleware chain, after `requireAuth` if the route is authenticated.

## How to migrate to Redis later

Create a new file (e.g. `src/rateLimit/redisRateLimitStore.js`) implementing the same contract the in-memory store implements:

```js
export async function consume(key, { maxRequests, windowMs }) {
  // returns { allowed: boolean, remaining: number, resetAt: timestamp }
}
```

A Redis implementation would naturally use `INCR` + `EXPIRE` (or `PEXPIRE` for millisecond precision) on the given key. Then change the one import in `src/rateLimit/index.js`:

```js
// import * as inMemoryRateLimitStore from './inMemoryRateLimitStore.js';
import * as redisRateLimitStore from './redisRateLimitStore.js';
export const rateLimitProvider = redisRateLimitStore;
```

No route, no middleware, no policy definition changes. This becomes necessary once the backend runs across multiple instances (an in-memory store's counts don't share state across processes), not before.

## Known limitation of the in-memory store

Counts reset whenever the process restarts (a deploy, a crash, `nodemon` picking up a file change in development). This is expected and acceptable for a single-instance deployment - the alternative (Redis) is exactly what the swap above is for, once it's actually needed.
