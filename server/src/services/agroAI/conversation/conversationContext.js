import { summarizeForContext } from './replyBuilder.js';

// Configurable, not hardcoded inline anywhere it's used. ~3 turns
// (a turn = one farmer message + one assistant reply) is enough for
// genuine short-term follow-ups ("there", "summarize", "give it in
// Kannada") without growing into anything resembling long-term memory
// - bounded by count, not by any semantic relevance judgment.
export const CONTEXT_WINDOW_MESSAGES = 6;

// Turns a list of recent Message documents into one compact,
// human-readable block for a prompt - never raw documents, never card
// JSON. Each line comes from replyBuilder's own summarizeForContext,
// reusing the same per-card-type field knowledge already established
// there rather than a second, parallel understanding of message shapes.
export function buildConversationSummary(recentMessages) {
  const lines = recentMessages.map(summarizeForContext).filter(Boolean);
  if (lines.length === 0) return '';
  return `Recent conversation:\n${lines.join('\n')}`;
}
