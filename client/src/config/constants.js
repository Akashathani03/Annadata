// Fallback reference point for guest-accessible screens (Home's
// weather card, Market Prices' distance sort) when no user is logged
// in, or a logged-in user hasn't captured/entered a location yet.
// Real per-user location comes from the authenticated user record
// (AuthContext) wherever one exists - this is only the anonymous
// default.
export const DEFAULT_LOCATION = {
  lat: 15.8497,
  lng: 74.4977,
  label: 'Belagavi, Karnataka',
};

// How long a captured live-GPS location is trusted before Home
// silently re-checks it. Configurable in one place - a farmer who's
// traveled since their location was last captured gets a fresh fix
// without ever being prompted again or needing a manual refresh.
export const GPS_STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
