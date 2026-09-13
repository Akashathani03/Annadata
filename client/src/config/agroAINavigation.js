// Step 17, Design B: the backend decides *what* screen a navigate
// intent means (a stable identifier, e.g. 'SELL_CROP'); this file is
// the one place that decides *how* to actually get there. The
// frontend never makes a routing decision of its own - it only maps
// an already-approved identifier to a route. An identifier not in
// this map is never guessed at (see resolveDestinationRoute below).
export const DESTINATION_ROUTES = {
  SELL_CROP: '/sell',
  BUY_CROP: '/buy',
  SELL_ANIMAL: '/sell-animal',
  BUY_ANIMAL: '/buy-animal',
  SELL_EQUIPMENT: '/sell-equipment',
  BUY_EQUIPMENT: '/buy-equipment',
  MARKET_PRICES: '/market-prices',
  NEAR_SHOPS: '/near-shop',
  SHOP_OWNER: '/shop-owner',
  SCHEMES: '/schemes',
  PROFILE: '/profile',
  HOME: '/',
};

// Returns the route for a destination identifier, or null if it isn't
// a recognized one - callers must treat null as "do nothing," never
// fall back to guessing a route.
export function resolveDestinationRoute(destination) {
  return DESTINATION_ROUTES[destination] ?? null;
}
