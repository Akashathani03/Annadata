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
// whether this object is accurate. Nothing writes to it yet; the
// schema exists now because the Session model owning it was part of
// the locked architecture, not because Step 3 implements the writer.
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
