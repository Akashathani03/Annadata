import mongoose from 'mongoose';

// One document per conversation (per the "start fresh every open"
// decision already shipped on the frontend - a new Session begins
// each time, the old one stays complete and untouched). This is what
// makes the future multi-chat/history-list feature additive later:
// there will already be many real Session rows per active user by the
// time that screen gets built, because that's what's been happening
// since this model went live.
//
// context is intentionally small and best-effort (per that session's
// explicit framing - "not authoritative"). It exists to let a future
// Intent Router avoid re-asking a question it could already answer
// from recent turns, never to be a source of factual truth - real
// facts only ever come from real domain service calls, regardless of
// whether this object is accurate.
//
// STATUS (Step 18 decision): this field's entire original purpose -
// short-term conversation memory for follow-up resolution - was fully
// achieved by Step 16's conversation-context work, via a different
// mechanism (re-deriving a compact summary from recent Message
// documents on each reply, rather than incrementally persisting one
// here). Compared directly against this field's own design goal, the
// Step 16 approach covers every case this field could and more (any
// message type, not just crop/diagnosis), and is the one actually
// proven in a live multi-turn conversation. Nothing writes to this
// field, and nothing should - reviving it would mean two parallel
// short-term-memory mechanisms to keep consistent for zero additional
// capability. Left in place deliberately (not deleted), same as other
// superseded-but-harmless code elsewhere in this project, in case a
// genuinely distinct future need for it is ever identified - but it
// should not be treated as a pending obligation.
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Null until the Previous Chats list has something to show for this
    // conversation - set once, automatically, from the farmer's first
    // message (see conversation.service.js's generateReply), or later
    // by hand via the rename endpoint. Never required: an old session
    // from before this field existed simply has no title, which the
    // Previous Chats UI treats as "untitled," not an error.
    title: {
      type: String,
      default: null,
    },
    // Previous Chats' Pinned Chats section. Plain per-session flag on
    // the same document - no separate collection, per the approved
    // approach. A pinned session still appears in "All Chats" too;
    // this field only ever affects which sections the frontend shows
    // it in, never ownership/visibility rules.
    pinned: {
      type: Boolean,
      default: false,
    },
    context: {
      recentCropName: { type: String, default: null },
      recentDiagnosisSummary: { type: String, default: null },
      updatedAt: { type: Date, default: null },
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // createdAt = when this session/conversation started
);

export const Session = mongoose.model('Session', sessionSchema);
