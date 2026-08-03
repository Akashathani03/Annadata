import mongoose from 'mongoose';

// Same string-slug _id pattern as ApmcMarket/Crop, for the same
// reason: the frontend's routes/lookups already use these exact
// human-readable ids ('pm-kisan', 'pmfby', ...), so using them as the
// real _id avoids any mapping layer.
const governmentSchemeSchema = new mongoose.Schema(
  {
    _id: { type: String },
    title: { type: String, required: true },
    dept: { type: String, required: true },
    scope: { type: String, enum: ['central', 'state'], required: true },
    iconBg: { type: String, default: '#e8f5ec' },
    icon: { type: String, default: '📜' },
    status: { type: String, enum: ['open', 'closing'], default: 'open' },
    description: { type: String, required: true },
    detailDescription: { type: String, default: '' },
    amount: { type: String, default: '' },
    detailAmount: { type: String, default: '' },
    deadline: { type: String, default: '' },
    detailDeadline: { type: String, default: '' },
    appliedCount: { type: String, default: '' },
    officialUrl: { type: String, required: true },
    eligibility: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const GovernmentScheme = mongoose.model('GovernmentScheme', governmentSchemeSchema);
