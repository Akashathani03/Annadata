// Stable, backend-owned destination identifiers for the navigate
// intent - never a frontend route string. The frontend owns its own
// separate mapping from these same identifiers to actual routes
// (Design B: the backend decides *what* screen is meant, the frontend
// decides *how* to get there). This list is the backend's source of
// truth for what's valid to return; the routing schema's validator
// checks against it directly, not a duplicated copy.
//
// Top-level screens only, per Step 17's explicit scope - no deep
// linking to specific records (a listing id, a specific scheme, etc).
export const VALID_DESTINATIONS = [
  'SELL_CROP',
  'BUY_CROP',
  'SELL_ANIMAL',
  'BUY_ANIMAL',
  'SELL_EQUIPMENT',
  'BUY_EQUIPMENT',
  'MARKET_PRICES',
  'NEAR_SHOPS',
  'SHOP_OWNER',
  'SCHEMES',
  'PROFILE',
  'HOME',
];
