import mongoose from 'mongoose';

// Same string-slug _id pattern as ApmcMarket, for the same reason.
// Fields mirror the frontend's existing cropCatalog.js exactly -
// `group` is the crop sub-classification (veg/cereal/oilseed/spice/...)
// used by Buy Crops' category filter; `category` is the top-level
// marketplace category ('crop', with 'animal' existing separately in
// the frontend's mock data for Sell/Buy Animals, not part of this
// collection).
const cropSchema = new mongoose.Schema(
  {
    _id: { type: String },
    category: { type: String, required: true },
    group: { type: String, required: true },
    name: { type: String, required: true },
    kannadaName: { type: String, required: true },
    icon: { type: String, required: true },
    defaultUnit: { type: String, required: true },
  },
  { timestamps: true }
);

export const Crop = mongoose.model('Crop', cropSchema);
