import * as marketPricesService from '../../services/domain/marketPrices/marketPrices.service.js';
import * as weatherService from '../../services/domain/weather/weather.service.js';
import * as nearShopsService from '../../services/domain/shops/nearShops.service.js';
import * as governmentSchemesService from '../../services/domain/schemes/governmentSchemes.service.js';
import * as listingsService from '../../services/domain/listings/listings.service.js';
import * as cropRepository from '../../repositories/crop.repository.js';
import { distanceKm } from '../../utils/geo.js';

// RESOLVED (was the "FUTURE CAPABILITY" note through the Equipment
// phases): search_marketplace_listings below is that deferred
// listing_lookup tool, now built now that the Marketplace has
// stabilized across crop/animal/equipment. Same tool pattern as the 4
// tools that follow it - execute(args, context), args only ever what
// Gemini extracted from text, context carrying the farmer's trusted
// location the same way it already does for weather_lookup and
// nearby_shops_lookup.

// Each tool's `parameters` is plain, standard (lowercase) JSON Schema -
// genuinely provider-neutral, not Gemini's uppercase Type enum. The
// current Gemini SDK accepts this directly via parametersJsonSchema
// (confirmed against current docs), so no translation layer is needed
// here at all - a future OpenAI/Claude adapter could use these same
// definitions close to as-is.
//
// Every executor receives (args, context): args is only ever what
// Gemini extracted from the conversation text; context carries
// session-level data (the farmer's location) that Gemini is never
// asked to extract, since it isn't something a farmer states in a
// message - it's already known from their profile. This split is the
// concrete answer to the location-dependency finding above.
//
// Each executor's real work is calling the actual domain service(s) -
// the single source of truth already built in Steps 7-10. Nothing
// here invents or approximates a fact; a lookup that finds nothing
// returns { found: false }, never a guess.

// FUTURE ROADMAP NOTE (do not implement yet): market comparison and
// pricing insights - questions like "is this rate good" or "compare
// prices across markets" (confirmed via real testing: currently just
// re-answers with the same single nearest-market price, since no tool
// or schema makes a qualitative judgment or compares across markets).
// This is a distinct future capability from conversation context
// above - it needs either a new tool (e.g. comparing modalPrice
// across multiple nearby APMCs, or against recentHistory to judge
// "good" vs "typical") or an extension to this one, not something the
// existing single-market lookup can answer today.
async function executeMarketPriceLookup(args, context) {
  const markets = await marketPricesService.getApmcMarkets({ lat: context.lat, lng: context.lng });
  if (markets.length === 0) {
    return { found: false, reason: 'no_markets_available' };
  }
  const nearestMarket = markets[0]; // already sorted nearest-first by the service

  // No crop given - the farmer is likely asking about the market
  // itself (e.g. "is APMC near me"), not a price. This is now a
  // genuinely valid, expected case (the tool description explicitly
  // invites APMC-only questions), not an error - answer with the
  // market's own info instead of forcing a crop search on nothing.
  if (!args.cropName?.trim()) {
    return { found: true, apmc: nearestMarket, priceInfoAvailable: false };
  }

  const crops = await marketPricesService.searchCrops(args.cropName);
  if (crops.length === 0) {
    return { found: false, reason: 'crop_not_recognized' };
  }
  const crop = crops[0];

  const detail = await marketPricesService.getCropPriceDetail(nearestMarket.id, crop.id);
  if (!detail) {
    return { found: false, reason: 'no_price_data_for_crop' };
  }

  return { found: true, ...detail };
}

async function executeWeatherLookup(args, context) {
  const weather = await weatherService.getCurrentWeather({ lat: context.lat, lon: context.lng });
  if (!weather) {
    return { found: false, reason: 'weather_unavailable' };
  }
  return { found: true, ...weather };
}

async function executeNearbyShopsLookup(args, context) {
  const shops = await nearShopsService.getNearbyShops({
    query: args.productQuery,
    buyerLat: context.lat,
    buyerLng: context.lng,
  });
  // Capped, not truncated silently - the farmer sees the nearest
  // handful, matching how Near Shop's own browse screen already
  // behaves (nearest-first), not an arbitrary cutoff.
  return { found: shops.length > 0, shops: shops.slice(0, 5) };
}

async function executeGovernmentSchemeLookup(args) {
  const schemes = await governmentSchemesService.getSchemes({ query: args.query || '' });
  return { found: schemes.length > 0, schemes: schemes.slice(0, 5) };
}

const MARKETPLACE_CATEGORIES = ['crop', 'animal', 'equipment'];

// A reasonable "nearby" radius for this app's semi-rural/rural
// context - large enough that equipment (which farmers may
// reasonably travel further for than a bag of seed) isn't
// under-matched, small enough to stay meaningfully "near your
// location" rather than the whole district. No existing app-wide
// radius constant to match (nearby_shops_lookup uses nearest-5, not a
// radius cutoff at all) - chosen explicitly here, not inherited.
const DEFAULT_MARKETPLACE_RADIUS_KM = 25;

// Resolves a farmer's free-text item phrase ("tractor", "tractors")
// to a real catalog itemId, scoped to the given category - generic
// across crop/animal/equipment via the new
// cropRepository.searchByNameAndCategory, not three separate
// category-specific lookups. Only a trailing-'s' strip for simple
// plural handling, deliberately not a general stemmer or synonym
// system (per the approved scope) - "tractors" -> "tractor" is
// covered; more elaborate phrasing is the LLM's job to normalize into
// a clean itemQuery before this ever runs, not this function's.
async function resolveItemId(itemQuery, category) {
  const normalized = itemQuery?.trim();
  if (!normalized) return null;

  const candidates = [normalized];
  if (normalized.endsWith('s') && normalized.length > 3) {
    candidates.push(normalized.slice(0, -1));
  }

  for (const candidate of candidates) {
    const matches = await cropRepository.searchByNameAndCategory(candidate, category);
    if (matches.length > 0) return matches[0]._id;
  }
  return null;
}

async function executeMarketplaceSearch(args, context) {
  if (!MARKETPLACE_CATEGORIES.includes(args.category)) {
    return { found: false, reason: 'invalid_category' };
  }

  // Marketplace search is inherently "near me" in intent - every
  // example query in the approved spec implies proximity, so an
  // unbounded, distance-blind search would risk showing a listing
  // hundreds of km away as if it were nearby. Ask for location
  // plainly rather than guess or silently drop the distance filter
  // (the earlier Phase 1/2 behavior, now superseded by this explicit
  // Phase 3 requirement).
  if (context.lat == null || context.lng == null) {
    return { found: false, reason: 'location_unavailable' };
  }

  let itemId;
  let textQuery;
  if (args.itemQuery?.trim()) {
    itemId = await resolveItemId(args.itemQuery, args.category);
    if (!itemId) {
      // Not a fixed-catalog item - crop/animal/equipment listings can
      // all legitimately be published with a farmer-typed name outside
      // the catalog (see itemId: null handling in Create Listing), so
      // this doesn't mean nothing exists. Fall back to the same
      // itemName text search getListings already supports, rather
      // than reporting "not recognized" for something that may
      // genuinely be listed.
      textQuery = args.itemQuery.trim();
    }
  }

  const searchParams = { category: args.category, page: 1, limit: 10 };
  if (itemId) searchParams.itemId = itemId;
  if (textQuery) searchParams.query = textQuery;
  if (args.priceMax != null) searchParams.priceMax = args.priceMax;
  // Equipment-only, per the approved scope - a condition value
  // extracted for a crop/animal question is silently dropped rather
  // than forwarded (getListings would just filter those categories to
  // zero anyway, since their listings always have condition:null, but
  // dropping it here avoids a misleading "nothing found" for what was
  // really just an inapplicable filter).
  if (args.condition && args.category === 'equipment') searchParams.condition = args.condition;
  if (context.lat != null && context.lng != null) {
    searchParams.lat = context.lat;
    searchParams.lng = context.lng;
    searchParams.radiusKm = DEFAULT_MARKETPLACE_RADIUS_KM;
  }

  let result;
  try {
    result = await listingsService.getListings(searchParams);
  } catch (err) {
    // Defensive only - resolveItemId already guarantees itemId
    // belongs to category, so getListings' own validation shouldn't
    // normally reject this. A genuine validation failure degrades to
    // "not found," never a raw error or an invented result reaching
    // the farmer.
    return { found: false, reason: 'search_error' };
  }

  return {
    found: result.listings.length > 0,
    category: args.category,
    listings: result.listings.slice(0, 5).map((l) => ({
      ...l,
      distanceKm: context.lat != null && context.lng != null ? distanceKm(context.lat, context.lng, l.lat, l.lng) : null,
    })),
  };
}

export const tools = [
  {
    name: 'market_price_lookup',
    description:
      "Look up today's real market price for a specific crop, and information about the farmer's nearest APMC/mandi market itself (its name, distance, or location). Use this for ANY question mentioning APMC, mandi, or market - including \"which APMC is nearest\" or \"is the APMC near me\" - even if the word \"price\" isn't used. This is different from nearby_shops_lookup, which is about input-supply shops (seed/fertilizer/pesticide retailers), not government markets.",
    parameters: {
      type: 'object',
      properties: {
        cropName: { type: 'string', description: 'The crop the farmer is asking about, e.g. "onion", "tomato".' },
      },
      required: ['cropName'],
    },
    execute: executeMarketPriceLookup,
  },
  {
    name: 'weather_lookup',
    description: "Get the current weather at the farmer's location.",
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: executeWeatherLookup,
  },
  {
    name: 'nearby_shops_lookup',
    description:
      "Find real input-supply shops (seed, fertilizer, pesticide, or equipment retailers) near the farmer's location, optionally filtered by what product they're looking for. Do NOT use this for questions about APMC markets, mandis, or crop prices - those belong to market_price_lookup, even if the farmer's wording includes \"near\" or \"nearby\".",
    parameters: {
      type: 'object',
      properties: {
        productQuery: { type: 'string', description: 'What the farmer is looking to buy, e.g. "urea", "pesticide". Omit if they just want nearby shops generally.' },
      },
    },
    execute: executeNearbyShopsLookup,
  },
  {
    name: 'government_scheme_lookup',
    description: 'Find real government schemes relevant to what the farmer is asking about, e.g. irrigation subsidies, crop insurance, credit.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What kind of scheme the farmer is asking about.' },
      },
    },
    execute: executeGovernmentSchemeLookup,
  },
  {
    name: 'search_marketplace_listings',
    description:
      "Search REAL, currently published Annadata marketplace listings - crops, animals, or equipment for sale by other farmers. Use this for questions like \"any tractor near me\", \"is anyone selling tomatoes nearby\", \"used tractor under 5 lakh\", \"cows for sale near my village\". Never invent or guess a listing - only describe what this tool actually returns. If nothing is found, say so plainly rather than suggesting something similar exists.",
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['crop', 'animal', 'equipment'], description: 'Which marketplace category the farmer is asking about.' },
        itemQuery: { type: 'string', description: 'The specific item the farmer named, in their own words, e.g. "tractor", "tomato", "cow". Omit if they asked about a category generally.' },
        priceMax: { type: 'number', description: 'Maximum price in rupees, if the farmer gave one, e.g. "under 5 lakh" -> 500000, "below 500000" -> 500000.' },
        condition: { type: 'string', enum: ['new', 'used-good', 'used-fair'], description: 'Only for equipment, only if the farmer specified a condition, e.g. "used tractor" -> used-good.' },
      },
      required: ['category'],
    },
    execute: executeMarketplaceSearch,
  },
];
