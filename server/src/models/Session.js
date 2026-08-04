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
