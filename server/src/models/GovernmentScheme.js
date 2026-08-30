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
    // 'seed' until a human actually checks this scheme's real page and
    // updates it (scripts/update-government-scheme.js) - same honesty
    // pattern as MarketPrice.source, so every layer above this can
    // tell a genuinely-checked record apart from placeholder seed
    // content instead of presenting both with equal confidence. No
    // machine-readable government source exists for scheme
    // eligibility/deadlines/amounts (checked directly against
    // data.gov.in and myscheme.gov.in - neither offers one), so this
    // is deliberately a manual-verification field, not an
    // automated-sync one like Agmarknet's.
    source: { type: String, enum: ['seed', 'verified'], default: 'seed' },
    lastVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const GovernmentScheme = mongoose.model('GovernmentScheme', governmentSchemeSchema);
