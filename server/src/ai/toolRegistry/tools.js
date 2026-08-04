import * as marketPricesService from '../../services/domain/marketPrices/marketPrices.service.js';
import * as weatherService from '../../services/domain/weather/weather.service.js';
import * as nearShopsService from '../../services/domain/shops/nearShops.service.js';
import * as governmentSchemesService from '../../services/domain/schemes/governmentSchemes.service.js';

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
];
