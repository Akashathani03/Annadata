import mongoose from 'mongoose';

// Shared across the whole Annadata backend, not owned by Agro AI - per
// the frozen folder structure and Database & Conversation Memory
// sessions ("Users - shared, already exists elsewhere in Annadata.
// Agro AI never owns or duplicates this"). This is the first real
// backend model for it.
//
// Fields deliberately mirror the frontend's existing (localStorage)
// User shape closely - not because this step needs all of them for
// auth itself (only `phone` does), but because a future real Users
// domain service will need this same shape anyway, and getting it
// close now avoids a migration later. Profile-management business
// logic (editing these fields, etc.) is explicitly not part of this
// step - only what's needed to issue a real JWT.
const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, default: '' },
    village: { type: String, default: '' },
    taluk: { type: String, default: '' },
    district: { type: String, default: '' },
    state: { type: String, default: '' },
    lat: { type: Number, min: -90, max: 90, default: null },
    lng: { type: Number, min: -180, max: 180, default: null },
    language: { type: String, enum: ['en', 'kn', 'mix'], default: 'mix' },
    profilePhotoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
