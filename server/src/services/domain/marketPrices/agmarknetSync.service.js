import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import * as marketPriceRepository from '../../../repositories/marketPrice.repository.js';

// data.gov.in's "Variety-wise Daily Market Prices Data of Commodity"
// (Ministry of Agriculture & Farmers Welfare / Agmarknet), the
// official government mandi price feed. Resource id confirmed live
// against the real API, not guessed.
const API_URL = 'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24';

// Our apmcId -> the exact District/Market strings Agmarknet reports
// under, hand-verified against live API responses. Agmarknet's Market
// field uses inconsistent, sometimes pre-rename spellings ("Belgaum
// APMC" not "Belagavi APMC", "Kudchi APMC" not "Kudachi APMC") - the
// same kind of gap as the Census village data elsewhere in this app.
// Ramanagara and Chikodi APMC don't appear anywhere in this feed as of
// this writing (checked directly under every district-name variant we
// could think of, not an oversight) - those two markets keep whatever
// price seed-market-prices.js gave them until/unless that changes.
const MARKET_ALIASES = {
  mandya: { district: 'Mandya', market: 'Mandya APMC' },
  maddur: { district: 'Mandya', market: 'Maddur APMC' },
  bengaluru: { district: 'Bengaluru', market: 'Bengaluru APMC' },
  mysuru: { district: 'Mysuru', market: 'Mysuru APMC' },
  hassan: { district: 'Hassan', market: 'Hassan APMC' },
  tumakuru: { district: 'Tumakuru', market: 'Tumakuru APMC' },
  shivamogga: { district: 'Shivamogga', market: 'Shimoga APMC' },
  mangaluru: { district: 'Dakshina Kannada', market: 'Mangaluru APMC' },
  hubli: { district: 'Dharwad', market: 'APMC Hubballi' },
  kalaburagi: { district: 'Kalaburagi', market: 'Kalaburagi APMC' },
  belagavi: { district: 'Belagavi', market: 'Belgaum APMC' },
  athani: { district: 'Belagavi', market: 'Athani APMC' },
  gokak: { district: 'Belagavi', market: 'Gokak APMC' },
  kudachi: { district: 'Belagavi', market: 'Kudchi APMC' },
  // Not in the feed - intentionally omitted: ramanagara, chikodi
};

// Our cropId -> Agmarknet's exact Commodity string, same idea as
// MARKET_ALIASES above. Turmeric and Sugarcane genuinely don't appear
// in any of our target markets' recent reports (checked directly) -
// sugarcane in particular is usually contracted straight to mills
// rather than sold through an APMC auction, so its absence here is
// expected, not a lookup miss.
const CROP_ALIASES = {
  tomato: 'Tomato',
  onion: 'Onion',
  paddy: 'Paddy(Common)',
  maize: 'Maize',
  ragi: 'Ragi(Finger Millet)',
  groundnut: 'Groundnut',
  chilli: 'Dry Chillies',
  brinjal: 'Brinjal',
  jowar: 'Jowar(Sorghum)',
  potato: 'Potato',
  coconut: 'Coconut',
  // Not in the feed for our target markets - intentionally omitted: turmeric, sugarcane
};

const HISTORY_LENGTH = 3;
// One call per market (14 total), not one per market+crop (154) -
// far gentler on data.gov.in's shared, rate-limited public demo key,
// and each call already returns that market's full recent report
// across every commodity it trades, not just the one we'd have asked
// for.
const RECORDS_PER_MARKET = 500;
// Keeps sequential calls spaced out rather than firing all 14 at once -
// same "don't hammer a shared public endpoint" reasoning as
// geocoding.service.js's outbound throttle.
const MIN_GAP_MS = 500;

function toIsoDate(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchMarketRecords({ district, market }) {
  const params = new URLSearchParams({
    'api-key': env.agmarknetApiKey,
    format: 'json',
    limit: String(RECORDS_PER_MARKET),
    'filters[State]': 'Karnataka',
    'filters[District]': district,
    'filters[Market]': market,
    'sort[Arrival_Date]': 'desc',
  });

  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`agmarknet responded ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.records) ? data.records : [];
}

// Builds { minPrice, modalPrice, maxPrice, priceDate, history } for
// one crop from one market's already-fetched records - records is
// this market's full recent report (every commodity it trades),
// already sorted newest-first by the API call above.
function buildPriceUpdate(records, commodity) {
  const seenDates = new Set();
  const history = [];
  for (const r of records) {
    if (r.Commodity !== commodity) continue;
    const date = toIsoDate(r.Arrival_Date);
    if (seenDates.has(date)) continue; // multiple grades/varieties can share a date - keep the first (most relevant) one
    seenDates.add(date);
    history.push({
      date,
      minPrice: Number(r.Min_Price),
      modalPrice: Number(r.Modal_Price),
      maxPrice: Number(r.Max_Price),
    });
    if (history.length >= HISTORY_LENGTH) break;
  }

  if (history.length === 0) return null;
  const [latest] = history;
  return { ...latest, priceDate: latest.date, history };
}

// One sync pass across every market/crop combination this app knows
// how to match (see the alias tables above) - meant to be called once
// at server startup and then on a recurring schedule (see server.js),
// or standalone via scripts/sync-agmarknet-prices.js. Never touches a
// market/crop combination it can't match to real Agmarknet data -
// those simply keep whatever price they already had (seed data, or a
// previous sync), never overwritten with a guess.
export async function syncAgmarknetPrices() {
  let updated = 0;
  let skippedNoData = 0;
  let failedMarkets = 0;

  let nextCallAt = 0;

  for (const [apmcId, marketRef] of Object.entries(MARKET_ALIASES)) {
    const wait = Math.max(0, nextCallAt - Date.now());
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    nextCallAt = Date.now() + MIN_GAP_MS;

    let records;
    try {
      records = await fetchMarketRecords(marketRef);
    } catch (err) {
      logger.warn({ err, apmcId, marketRef }, 'Agmarknet fetch failed for market');
      failedMarkets++;
      continue;
    }

    for (const [cropId, commodity] of Object.entries(CROP_ALIASES)) {
      const priceUpdate = buildPriceUpdate(records, commodity);
      if (!priceUpdate) {
        skippedNoData++;
        continue;
      }

      const { priceDate, minPrice, modalPrice, maxPrice, history } = priceUpdate;
      try {
        await marketPriceRepository.upsert(apmcId, cropId, {
          minPrice,
          modalPrice,
          maxPrice,
          priceDate,
          source: 'agmarknet',
          history,
        });
        updated++;
      } catch (err) {
        logger.warn({ err, apmcId, cropId }, 'Failed to save synced Agmarknet price');
      }
    }
  }

  logger.info({ updated, skippedNoData, failedMarkets }, 'Agmarknet price sync complete');
  return { updated, skippedNoData, failedMarkets };
}
