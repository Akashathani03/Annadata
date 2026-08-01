import { demoFarmerProfile } from '../config/constants';

// Single mutable profile record for the MVP demo farmer. Real auth
// later replaces this with a per-user document; the repository/service
// shape below doesn't change.
export const profile = { ...demoFarmerProfile };
