import mongoose from 'mongoose';

// One shop per owner - the frontend's upsertByOwnerId semantics (find
// by ownerId, create if missing, otherwise patch) are preserved
// exactly by the service layer; this model just needs ownerId to be
// unique to make that meaningful.
const shopSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    shopName: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    location: { type: String, default: '' },
    address: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    // 'active' once the required fields are filled (matches the
    // frontend's existing Incomplete -> Active status pill) - this
    // distinction is what makes a shop visible in Near Shop at all.
    status: { type: String, enum: ['incomplete', 'active'], default: 'incomplete' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Shop = mongoose.model('Shop', shopSchema);
