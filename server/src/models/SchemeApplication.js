import mongoose from 'mongoose';

// The mock's schemeApplicationsRepository had no owner concept at all
// (a single global list, same for every browser). That was fine for
// single-user mock data but cannot carry over to a real backend - a
// real "my applications" list has to actually belong to someone, or
// every farmer would see every other farmer's applications. userId is
// the necessary correction here, not new scope invented on top of
// what the frontend already does.
const schemeApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    schemeId: { type: String, ref: 'GovernmentScheme', required: true },
    // Denormalized copy of the scheme's title at time of application -
    // matches the mock's exact existing behavior (schemeTitle stored
    // alongside schemeId, not looked up fresh each render).
    schemeTitle: { type: String, required: true },
    status: { type: String, enum: ['Applied', 'In Review', 'Approved'], default: 'Applied' },
    submittedAt: { type: String, required: true }, // YYYY-MM-DD, matches the mock's existing string format
  },
  { timestamps: true }
);

export const SchemeApplication = mongoose.model('SchemeApplication', schemeApplicationSchema);
