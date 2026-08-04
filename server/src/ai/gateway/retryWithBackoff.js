// Generic retry-with-exponential-backoff, no Gemini-specific
// knowledge beyond reading a thrown error's .status - reusable by any
// provider client the Gateway ever adds, not just geminiClient.js.

const TRANSIENT_STATUS_CODES = [429, 500, 502, 503, 504];

export function isTransientError(err) {
  return TRANSIENT_STATUS_CODES.includes(err?.status);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Each retry roughly doubles the previous wait, plus a small random
// jitter so multiple requests retrying around the same time don't all
// collide on an identical schedule. Re-throws the last error once
// retries are exhausted, or immediately for a non-transient error -
// no point retrying a genuine 400 (bad request) or 401 (bad key).
export async function retryWithBackoff(fn, { maxRetries = 3, baseDelayMs = 500 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || attempt === maxRetries) {
        throw err;
      }
      const backoff = baseDelayMs * 2 ** attempt;
      const jitter = Math.random() * baseDelayMs;
      await delay(backoff + jitter);
    }
  }
  throw lastError;
}
