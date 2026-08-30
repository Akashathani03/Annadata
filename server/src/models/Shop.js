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
    phone: { type: String, required: true },
    whatsapp: { type: String, default: '' },
    // `location` stays the flat display string (also used by
    // determineStatus's completeness check) - the locationX fields below
    // are additive, mirroring the Listing model's pattern, so the
    // Village/Taluk/District/State picker can re-populate correctly on
    // reload instead of guessing by splitting the display string.
    location: { type: String, default: '' },
    locationVillage: { type: String, default: '' },
    locationArea: { type: String, default: '' },
    locationTaluk: { type: String, default: '' },
    locationDistrict: { type: String, default: '' },
    locationState: { type: String, default: '' },
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
