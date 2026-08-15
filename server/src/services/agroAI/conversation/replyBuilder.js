// Maps a routing decision's outcome into the exact persisted-message
// shape AIMessageContent.jsx already knows how to render. Confirmed
// directly against the real component and the Message model's cardType
// enum (['diagnosis', 'weather', 'marketPrice', 'fertilizer', null]) -
// nearby_shops_lookup and government_scheme_lookup have no card type
// to map to, so their results render as plain natural-language text,
// same as navigate and out_of_scope. This file produces zero new UI
// requirements; it only ever targets what already exists.

function buildMarketPriceReply(toolResult) {
  if (!toolResult?.found) {
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: "I couldn't find today's price for that crop. Please check Market Prices directly, or try a different crop name.",
    };
  }

  // No crop was asked about - the farmer wanted the market itself
  // (e.g. "is APMC near me"), not a price. Answering that plainly is
  // more honest than forcing it into a price card with empty fields.
  if (toolResult.priceInfoAvailable === false) {
    const { apmc } = toolResult;
    const distance = apmc?.distanceKm != null ? ` (${apmc.distanceKm.toFixed(1)} km away)` : '';
    const district = apmc?.district ? `, ${apmc.district}` : '';
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: `Your nearest APMC market is ${apmc?.name}${distance}${district}.`,
    };
  }

  const { crop, apmc, minPrice, modalPrice, maxPrice, priceDate } = toolResult;

  return {
    type: 'card',
    cardType: 'marketPrice',
    cardData: {
      cropName: crop?.name,
      marketName: apmc?.name,
      location: apmc?.district,
      currentPrice: modalPrice,
      unit: crop?.defaultUnit,
      minPrice,
      maxPrice,
      lastUpdated: priceDate,
      // trend intentionally omitted - no genuine multi-day price
      // history exists to derive a real directional trend from.
      // toolResult.recentHistory is synthetic 3-day drift (see
      // marketPrices.service.js's buildRecentHistory), not real
      // data, so it must never be used to compute an "up"/"down"
      // signal shown to a farmer as if it were real.
    },
    text: '',
  };
}

// The backend has no i18n/translation infrastructure (that's a
// frontend-only concern) - weather.service.js's conditionKey values
// are meant to be resolved via the frontend's own t() calls, which
// this reply builder can't do. This is a small, separate plain-English
// mapping of the same known condition keys, used only for constructing
// this card's text - it does not touch or duplicate weather.service.js
// itself.
const CONDITION_LABELS = {
  'weather:conditions.sunny': 'Sunny',
  'weather:conditions.partlyCloudy': 'Partly cloudy',
  'weather:conditions.cloudy': 'Cloudy',
  'weather:conditions.foggy': 'Foggy',
  'weather:conditions.rainy': 'Rainy',
  'weather:conditions.stormy': 'Stormy',
};

function buildWeatherReply(toolResult) {
  if (!toolResult?.found) {
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: "I couldn't fetch the weather for your location right now. Please check the weather card on Home.",
    };
  }

  const { temperatureC, humidity, rainChance, conditionKey } = toolResult;

  let recommendation;
  let alert;
  if (rainChance >= 70) {
    alert = 'Heavy rain expected - protect harvested crops and delay spraying.';
  } else if (rainChance >= 40) {
    recommendation = 'Some rain expected - plan spraying or harvesting accordingly.';
  } else {
    recommendation = 'Good conditions for field work today.';
  }

  return {
    type: 'card',
    cardType: 'weather',
    cardData: {
      summary: CONDITION_LABELS[conditionKey] || 'Current conditions',
      temperature: `${temperatureC}°C`,
      rainPrediction: `${rainChance}%`,
      humidity: `${humidity}%`,
      recommendation,
      alert,
    },
    text: '',
  };
}

function buildShopsReply(toolResult) {
  if (!toolResult?.found || !toolResult.shops?.length) {
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: "I couldn't find any nearby shops for that. Try browsing Near Shop directly.",
    };
  }

  const lines = toolResult.shops.slice(0, 3).map((s) => {
    const distance = s.distanceKm != null ? ` (${s.distanceKm.toFixed(1)} km away)` : '';
    return `- ${s.shopName}${distance}`;
  });

  return {
    type: 'text',
    cardType: null,
    cardData: null,
    text: `I found these shops near you:\n${lines.join('\n')}\n\nCheck Near Shop for more details.`,
  };
}

function buildSchemesReply(toolResult) {
  if (!toolResult?.found || !toolResult.schemes?.length) {
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: "I couldn't find a matching government scheme. Try browsing Government Schemes directly.",
    };
  }

  const lines = toolResult.schemes
    .slice(0, 2)
    .map((s) => `- ${s.title}: ${s.description} (${s.amount})`);

  return {
    type: 'text',
    cardType: null,
    cardData: null,
    text: `Here's what I found:\n${lines.join('\n')}\n\nCheck Government Schemes for eligibility and to apply.`,
  };
}

// Card-producing now that Phase 3 builds the visual result card -
// cardType 'marketplaceListing' (added to the Message model's enum
// this phase). Not-found/unrecognized/no-location cases stay
// text-only, matching every other tool's "nothing to show" pattern.
// cardData deliberately carries only the same safe fields the earlier
// text-only version referenced - phone and ownerId are present on the
// underlying listing objects but never included here.
function buildMarketplaceSearchReply(toolResult) {
  if (toolResult?.reason === 'location_unavailable') {
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: 'I need your location to search nearby listings. Please enable location and try again.',
    };
  }

  if (toolResult?.reason === 'item_not_recognized') {
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: "I couldn't recognize that item in our marketplace catalog. Please try a different or more specific name.",
    };
  }

  if (!toolResult?.found || !toolResult.listings?.length) {
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: 'No matching listings were found near your location right now.',
    };
  }

  return {
    type: 'card',
    cardType: 'marketplaceListing',
    cardData: {
      listings: toolResult.listings.slice(0, 5).map((l) => ({
        id: l.id,
        category: l.category,
        itemName: l.itemName,
        price: l.price,
        condition: l.condition,
        distanceKm: l.distanceKm,
        location: l.location,
        photoUrl: l.photoUrl,
      })),
    },
    text: '',
  };
}

const LOOKUP_REPLY_BUILDERS = {
  market_price_lookup: buildMarketPriceReply,
  weather_lookup: buildWeatherReply,
  nearby_shops_lookup: buildShopsReply,
  government_scheme_lookup: buildSchemesReply,
  search_marketplace_listings: buildMarketplaceSearchReply,
};

export function buildLookupReply(targetTool, toolResult) {
  const builder = LOOKUP_REPLY_BUILDERS[targetTool];
  if (!builder) {
    // Should not happen - the Intent Router validates targetTool
    // against the real Tool Registry before this is ever reached. A
    // safe, honest fallback regardless, never a fabricated result.
    return {
      type: 'text',
      cardType: null,
      cardData: null,
      text: "I found some information but I'm not able to show it right now. Please check the relevant section of the app.",
    };
  }
  return builder(toolResult);
}

// cardData already has the disclaimer attached (buildDiagnosisCardData,
// Step 12) before this is called - this just wraps it as a message shape.
export function buildDiagnosisReply(cardData) {
  return { type: 'card', cardType: 'diagnosis', cardData, text: '' };
}

// Generic, presentation-only - deliberately has no knowledge of which
// intent produced this text (conversation, or anything else that's
// ever just plain text). The Reply Builder's job is only "how to
// present a response," never "why this response exists" - that
// separation is why this isn't named after any router intent.
export function buildTextReply(text) {
  return { type: 'text', cardType: null, cardData: null, text };
}

// Design B (Step 17): navigate produces a message with both a short
// human-readable line (content) AND an independent action field (an
// instruction), never mixed into cardType/cardData. destination stays
// exactly what the Intent Router validated it to be - a stable
// backend identifier, never touched or translated to a route here;
// that translation belongs entirely to the frontend's own mapping.
export function buildNavigateReply(destination) {
  return {
    type: 'text',
    cardType: null,
    cardData: null,
    text: 'Taking you there now.',
    action: { type: 'navigate', destination },
  };
}

export function buildOutOfScopeReply() {
  return buildTextReply(
    "I'm here to help with farming questions - crop prices, weather, nearby shops, government schemes, or crop problems. Could you ask something related to that?"
  );
}

// Step 16: converts one persisted message into a single compact,
// human-readable line for short-term conversation context - never the
// raw cardData JSON. Reuses this file's own per-card-type field
// knowledge (the same fields buildMarketPriceReply/buildWeatherReply
// already know about), rather than a separate, parallel understanding
// of what each card contains. Returns null for messages with nothing
// meaningful to summarize (e.g. an empty failed placeholder) - the
// caller filters these out rather than showing a blank line.
const MAX_TEXT_LENGTH_IN_CONTEXT = 200;

export function summarizeForContext(message) {
  const { sender, cardType, cardData, text, status } = message;
  if (status === 'failed') return null;

  const speaker = sender === 'user' ? 'Farmer' : 'Assistant';

  if (cardType === 'marketPrice' && cardData) {
    const price = cardData.currentPrice != null ? `₹${cardData.currentPrice}${cardData.unit ? `/${cardData.unit}` : ''}` : 'price unavailable';
    return `${speaker}: [Market price shown] ${cardData.cropName || 'a crop'} at ${cardData.marketName || 'the nearest market'} - ${price}`;
  }

  if (cardType === 'weather' && cardData) {
    return `${speaker}: [Weather shown] ${cardData.summary || 'current conditions'}${cardData.temperature ? `, ${cardData.temperature}` : ''}`;
  }

  if (cardType === 'diagnosis' && cardData) {
    return `${speaker}: [Diagnosis shown] ${cardData.problem || 'a crop issue'}${cardData.severity ? ` (${cardData.severity} severity)` : ''}`;
  }

  if (cardType === 'marketplaceListing' && cardData) {
    const count = cardData.listings?.length ?? 0;
    const names = (cardData.listings ?? []).slice(0, 3).map((l) => l.itemName).join(', ');
    return `${speaker}: [Marketplace listings shown] ${count} result(s)${names ? `: ${names}` : ''}`;
  }

  if (text) {
    const trimmed = text.length > MAX_TEXT_LENGTH_IN_CONTEXT ? `${text.slice(0, MAX_TEXT_LENGTH_IN_CONTEXT)}...` : text;
    return `${speaker}: ${trimmed}`;
  }

  return null;
}
