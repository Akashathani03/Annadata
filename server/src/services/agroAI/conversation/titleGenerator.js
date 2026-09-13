// Rule-based only, per the approved MVP scope - no LLM call for
// titles. Deliberately simple: strip common filler words a farmer's
// message often starts with, cap the result to a short farmer-
// readable length, and fall back to a safe generic label when there's
// nothing usable to work with (an image with no caption, or a message
// that's only filler words). A future LLM-fallback tier was proposed
// and explicitly deferred - see the architecture review - this file
// is deliberately the entire title-generation system for now, not a
// first tier of a larger one.

const MAX_TITLE_WORDS = 5;
const MAX_TITLE_LENGTH = 40;

// Small and conservative - only words that add no meaning on their
// own, never domain words a real title might need (e.g. "problem",
// "help" are kept; a farmer typing "help with my tomato" should still
// title as "Help With Tomato", not lose "help" as if it were filler).
const FILLER_WORDS = new Set([
  'my', 'is', 'are', 'the', 'a', 'an', 'i', 'me', 'in', 'on', 'at',
  'to', 'for', 'of', 'and', 'or', 'please', 'hi', 'hello', 'hey',
]);

function toTitleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Returns a short title, or null when the input has nothing usable
// (empty, image-only, or entirely filler words) - callers must treat
// null as "use a safe fallback label," never as an empty string title.
export function generateRuleBasedTitle(text) {
  if (!text?.trim()) return null;

  const words = text
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // strip punctuation, keep any-language letters/digits
    .split(/\s+/)
    .filter(Boolean);

  // Genuinely nothing left after removing filler (a bare "hi", "thanks",
  // "please") means there's no real topic to title - return null so the
  // caller uses FALLBACK_TITLE, rather than literally titling a
  // conversation "Hi".
  const meaningful = words.filter((w) => !FILLER_WORDS.has(w.toLowerCase()));
  if (meaningful.length === 0) return null;

  const chosen = meaningful.slice(0, MAX_TITLE_WORDS);

  const title = chosen.map(toTitleCase).join(' ');
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title;
}

// The safe fallback the caller uses when generateRuleBasedTitle
// returns null - never left blank in the Previous Chats list.
export const FALLBACK_TITLE = 'New Conversation';
