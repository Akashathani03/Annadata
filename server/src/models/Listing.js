import mongoose from 'mongoose';

// One unified schema for crop, animal, and equipment listings -
// category is the discriminator, matching the frontend's own
// already-proven design (listingFieldConfig.js). itemId always
// references the same Crop collection regardless of category -
// animals and equipment are both seeded into it as their own
// category:'animal'/'equipment' entries (see
// scripts/seed-animal-catalog.js, scripts/seed-equipment-catalog.js),
// not a separate collection, per the approved "extend, don't
// duplicate the catalog" decision.
const listingSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerType: { type: String, enum: ['farmer'], default: 'farmer' },
    category: { type: String, enum: ['crop', 'animal', 'equipment'], required: true },

    // References the Crop collection (Step 7) - same collection for
    // both categories, distinguished by that document's own category
    // field, not a separate Animal model. Nullable: a farmer selling a
    // crop that isn't in the catalog (a local/uncommon variety) types
    // its name directly instead - itemName is the field that's always
    // required and always trustworthy; itemId is only present when the
    // listing is actually catalog-backed (which is also what gates
    // whether a market-price lookup is even possible for it).
    itemId: { type: String, ref: 'Crop', default: null },
    // Denormalized snapshot of the item's display name at listing
    // time, per the approved decision - matches the frontend's own
    // existing pattern (itemName passed explicitly by the caller, not
    // derived fresh on every read). For a non-catalog crop, this is
    // the farmer's own typed name and the only record of it.
    itemName: { type: String, required: true },

    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['Kg', 'Quintal', 'Ton', 'Bag', 'Head', 'Unit'], required: true },
    // max is a typo guard, not a business rule - large but real sales
    // (a tractor, a premium bull, a big harvest) still fit well under
    // it; an extra accidental zero doesn't (flagged in both the Sell
    // Crop and Sell Animal audits). Custom message so a rejection
    // reads like guidance, not a stack trace - see
    // errorHandler.middleware.js for how this reaches the client.
    price: {
      type: Number,
      required: true,
      min: 0,
      max: [10000000, 'Price seems too high - please check the number and try again.'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description must be 200 characters or less.'],
    },
    // Up to 4 photos, farmer's own order (first is the primary
    // thumbnail everywhere a listing is shown as a single image - Buy
    // Browse cards, MyListings, Dashboard). Multiple angles are a real
    // trust signal for a marketplace where farmers are the sellers -
    // a single stock-looking photo is a known pattern in low-trust
    // listings, especially for livestock.
    photoUrls: { type: [String], default: [] },

    // Equipment-only - null for crop/animal listings. Deliberately a
    // constrained enum, not free text, since "new/used" is a small,
    // meaningful set worth validating server-side rather than trusting
    // arbitrary buyer-facing text.
    condition: { type: String, enum: ['new', 'used-good', 'used-fair', null], default: null },

    // Crop-only - null for animal listings (no APMC step, per
    // listingFieldConfig.js's existing hasApmcStep: false for animals).
    apmcId: { type: String, ref: 'ApmcMarket', default: null },
    apmcName: { type: String, default: '' },

    location: { type: String, default: '' },
    locationVillage: { type: String, default: '' },
    locationTaluk: { type: String, default: '' },
    locationDistrict: { type: String, default: '' },
    locationState: { type: String, default: '' },
    lat: { type: Number, min: -90, max: 90, default: null },
    lng: { type: Number, min: -180, max: 180, default: null },

    // Required - the entire buyer-contact flow is direct call/WhatsApp
    // (approved Enquiries decision: no in-app enquiry system), so this
    // has to exist for a published listing to be reachable at all.
    phone: { type: String, required: true },

    // 'closed' rather than 'sold' (approved refinement) - covers a
    // real sale AND any future reason a listing stops being active
    // (withdrawn, expired) without needing a new status value later.
    // Whether a 'closed' listing represents an actual sale is
    // determined by soldAt's presence, not a separate reason field -
    // deliberately minimal.
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },

    views: { type: Number, default: 0 },

    // Populated only when a listing closes via an actual sale
    // (markListingSold) - all null for a draft/published listing, and
    // null for any future non-sale closure (withdrawn, etc).
    soldQuantity: { type: Number, default: null },
    saleAmount: { type: Number, default: null },
    // Both kept (approved refinement): buyerName is free text, always
    // populated by the seller after an off-platform sale - there's no
    // real authenticated buyer account in this flow today. buyerId
    // stays null under every current code path but makes the schema
    // forward-compatible if in-app enquiries ever become a real,
    // separate future feature.
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    buyerName: { type: String, default: null },
    soldAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The two dominant query patterns: an owner's own listings by status
// (My Listings, My Sales), and public browse by category + status
// (Buy Crops/Buy Animals, always filtered to 'published').
listingSchema.index({ ownerId: 1, status: 1 });
listingSchema.index({ category: 1, status: 1 });

export const Listing = mongoose.model('Listing', listingSchema);
