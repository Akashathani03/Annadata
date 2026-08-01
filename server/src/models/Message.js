import mongoose from 'mongoose';

// One document per message. Content fields (text/photoUrl/cardType/
// cardData) are durable and immutable once created - the one field
// that legitimately changes after creation is `status`, per the
// already-built and approved Pending/Failed states (Step 14 on the
// frontend). Enum values below are not a new design - they're a
// direct match to what the frontend already sends and expects back,
// confirmed against the actual shipped MessageBubble/useAgroAIChat
// code, not re-derived from the architecture docs alone.
const messageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'card'],
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    photoUrl: {
      type: String,
      default: null,
    },
    cardType: {
      type: String,
      enum: ['diagnosis', 'weather', 'marketPrice', 'fertilizer', null],
      default: null,
    },
    cardData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'failed'],
      default: 'sent',
    },
  },
  { timestamps: true } // createdAt = when sent; updatedAt naturally tracks the last status transition
);

// The dominant, highest-volume access pattern per the Database session:
// "this session's messages, in order" - this compound index is what
// keeps that query fast as Messages grows into the largest collection.
messageSchema.index({ sessionId: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
