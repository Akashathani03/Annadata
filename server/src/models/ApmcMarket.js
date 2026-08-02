import mongoose from 'mongoose';

// _id is the existing human-readable slug ('mandya', 'maddur', ...),
// not an auto-generated ObjectId. The frontend's routes
// (/market-prices/:apmcId) already depend on these exact strings -
// using them as the real _id means no id-mapping layer is needed
// anywhere, and every existing URL keeps working unchanged.
const apmcMarketSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const ApmcMarket = mongoose.model('ApmcMarket', apmcMarketSchema);
