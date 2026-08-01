// Fallback reference point for guest-accessible screens (Home's
// weather card, Market Prices' distance sort) when no user is logged
// in, or a logged-in user hasn't captured/entered a location yet.
// Real per-user location comes from the authenticated user record
// (AuthContext) wherever one exists - this is only the anonymous
// default.
export const DEFAULT_LOCATION = {
  lat: 12.5242,
  lng: 76.8958,
  label: 'Mandya, Karnataka',
};
