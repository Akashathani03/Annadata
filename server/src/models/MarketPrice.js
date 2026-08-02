import mongoose from 'mongoose';

// The actual price records - references ApmcMarket/Crop by their
// string slugs (matching those models' _id type), mirroring exactly
// the shape already anticipated in the frontend's data/marketPrices.js
// comment: "{ apmc: ref(ApmcMarket), crop: ref(CropCatalog), minPrice,
// modalPrice, maxPrice, priceDate }".
const marketPriceSchema = new mongoose.Schema(
  {
    apmcId: { type: String, ref: 'ApmcMarket', required: true, index: true },
    cropId: { type: String, ref: 'Crop', required: true, index: true },
    minPrice: { type: Number, required: true },
    modalPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    priceDate: { type: String, required: true }, // YYYY-MM-DD, matches the frontend's existing string format
  },
  { timestamps: true }
);

// Dominant access pattern: "all prices for this market" and "the one
// price record for this market+crop" - both covered by this compound
// index.
marketPriceSchema.index({ apmcId: 1, cropId: 1 });

export const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);
