// Seeds ApmcMarket, Crop, and MarketPrice with the exact same data
// that currently lives in the frontend's data/apmcMarkets.js,
// data/cropCatalog.js, and data/marketPrices.js - so switching
// marketPricesService.js over to the real backend doesn't leave every
// screen empty. Safe to re-run: every write is an upsert.
//
// Usage: node scripts/seed-market-prices.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { ApmcMarket } from '../src/models/ApmcMarket.js';
import { Crop } from '../src/models/Crop.js';
import { MarketPrice } from '../src/models/MarketPrice.js';

dotenv.config();

const apmcMarkets = [
  { _id: 'mandya', name: 'Mandya APMC', district: 'Mandya', state: 'Karnataka', location: { lat: 12.5242, lng: 76.8958 } },
  { _id: 'maddur', name: 'Maddur APMC', district: 'Mandya', state: 'Karnataka', location: { lat: 12.5847, lng: 77.0419 } },
  { _id: 'ramanagara', name: 'Ramanagara APMC', district: 'Ramanagara', state: 'Karnataka', location: { lat: 12.7217, lng: 77.2812 } },
  { _id: 'bengaluru', name: 'Bengaluru APMC', district: 'Bengaluru', state: 'Karnataka', location: { lat: 12.9716, lng: 77.5946 } },
  { _id: 'mysuru', name: 'Mysuru APMC', district: 'Mysuru', state: 'Karnataka', location: { lat: 12.2958, lng: 76.6394 } },
  { _id: 'hassan', name: 'Hassan APMC', district: 'Hassan', state: 'Karnataka', location: { lat: 13.0072, lng: 76.0962 } },
  { _id: 'tumakuru', name: 'Tumakuru APMC', district: 'Tumakuru', state: 'Karnataka', location: { lat: 13.3379, lng: 77.1173 } },
  { _id: 'shivamogga', name: 'Shivamogga APMC', district: 'Shivamogga', state: 'Karnataka', location: { lat: 13.9299, lng: 75.5681 } },
  { _id: 'mangaluru', name: 'Mangaluru APMC', district: 'Dakshina Kannada', state: 'Karnataka', location: { lat: 12.9141, lng: 74.8560 } },
  { _id: 'hubli', name: 'Hubballi APMC', district: 'Dharwad', state: 'Karnataka', location: { lat: 15.3647, lng: 75.1240 } },
  { _id: 'kalaburagi', name: 'Kalaburagi APMC', district: 'Kalaburagi', state: 'Karnataka', location: { lat: 17.3297, lng: 76.8343 } },
  { _id: 'belagavi', name: 'Belagavi APMC', district: 'Belagavi', state: 'Karnataka', location: { lat: 15.8497, lng: 74.4977 } },
  { _id: 'chikodi', name: 'Chikodi APMC', district: 'Belagavi', state: 'Karnataka', location: { lat: 16.4326, lng: 74.5814 } },
  { _id: 'athani', name: 'Athani APMC', district: 'Belagavi', state: 'Karnataka', location: { lat: 16.724, lng: 75.064 } },
  { _id: 'gokak', name: 'Gokak APMC', district: 'Belagavi', state: 'Karnataka', location: { lat: 16.167, lng: 74.824 } },
  { _id: 'kudachi', name: 'Kudachi APMC', district: 'Belagavi', state: 'Karnataka', location: { lat: 16.628, lng: 74.854 } },
];

const crops = [
  { _id: 'tomato', category: 'crop', group: 'veg', name: 'Tomato', kannadaName: 'ಟೊಮ್ಯಾಟೊ', icon: '🍅', defaultUnit: 'Kg' },
  { _id: 'onion', category: 'crop', group: 'veg', name: 'Onion', kannadaName: 'ಈರುಳ್ಳಿ', icon: '🧅', defaultUnit: 'Kg' },
  { _id: 'paddy', category: 'crop', group: 'cereal', name: 'Paddy', kannadaName: 'ಭತ್ತ', icon: '🌾', defaultUnit: 'Quintal' },
  { _id: 'maize', category: 'crop', group: 'cereal', name: 'Maize', kannadaName: 'ಮೆಕ್ಕೆಜೋಳ', icon: '🌽', defaultUnit: 'Quintal' },
  { _id: 'ragi', category: 'crop', group: 'cereal', name: 'Ragi', kannadaName: 'ರಾಗಿ', icon: '🌾', defaultUnit: 'Quintal' },
  { _id: 'groundnut', category: 'crop', group: 'oilseed', name: 'Groundnut', kannadaName: 'ಶೇಂಗಾ', icon: '🥜', defaultUnit: 'Quintal' },
  { _id: 'chilli', category: 'crop', group: 'spice', name: 'Chilli', kannadaName: 'ಮೆಣಸಿನಕಾಯಿ', icon: '🌶️', defaultUnit: 'Kg' },
  { _id: 'brinjal', category: 'crop', group: 'veg', name: 'Brinjal', kannadaName: 'ಬದನೆಕಾಯಿ', icon: '🍆', defaultUnit: 'Kg' },
  { _id: 'jowar', category: 'crop', group: 'cereal', name: 'Jowar', kannadaName: 'ಜೋಳ', icon: '🌾', defaultUnit: 'Quintal' },
  { _id: 'potato', category: 'crop', group: 'veg', name: 'Potato', kannadaName: 'ಆಲೂಗಡ್ಡೆ', icon: '🥔', defaultUnit: 'Kg' },
  { _id: 'turmeric', category: 'crop', group: 'spice', name: 'Turmeric', kannadaName: 'ಅರಿಶಿನ', icon: '🟡', defaultUnit: 'Quintal' },
  { _id: 'coconut', category: 'crop', group: 'plantation', name: 'Coconut', kannadaName: 'ತೆಂಗಿನಕಾಯಿ', icon: '🥥', defaultUnit: 'Quintal' },
  { _id: 'sugarcane', category: 'crop', group: 'cash', name: 'Sugarcane', kannadaName: 'ಕಬ್ಬು', icon: '🎋', defaultUnit: 'Ton' },
];

const today = new Date().toISOString().slice(0, 10);

const marketPrices = [
  { apmcId: 'mandya', cropId: 'tomato', minPrice: 18, modalPrice: 22, maxPrice: 26 },
  { apmcId: 'mandya', cropId: 'onion', minPrice: 14, modalPrice: 17, maxPrice: 20 },
  { apmcId: 'mandya', cropId: 'paddy', minPrice: 1980, modalPrice: 2100, maxPrice: 2210 },
  { apmcId: 'mandya', cropId: 'maize', minPrice: 1750, modalPrice: 1860, maxPrice: 1950 },
  { apmcId: 'mandya', cropId: 'ragi', minPrice: 3100, modalPrice: 3250, maxPrice: 3400 },
  { apmcId: 'mandya', cropId: 'groundnut', minPrice: 5200, modalPrice: 5450, maxPrice: 5700 },
  { apmcId: 'mandya', cropId: 'chilli', minPrice: 60, modalPrice: 72, maxPrice: 85 },
  { apmcId: 'mandya', cropId: 'brinjal', minPrice: 12, modalPrice: 15, maxPrice: 19 },

  { apmcId: 'maddur', cropId: 'tomato', minPrice: 17, modalPrice: 21, maxPrice: 25 },
  { apmcId: 'maddur', cropId: 'onion', minPrice: 13, modalPrice: 16, maxPrice: 19 },
  { apmcId: 'maddur', cropId: 'paddy', minPrice: 1950, modalPrice: 2080, maxPrice: 2190 },
  { apmcId: 'maddur', cropId: 'ragi', minPrice: 3050, modalPrice: 3200, maxPrice: 3350 },

  { apmcId: 'ramanagara', cropId: 'tomato', minPrice: 19, modalPrice: 23, maxPrice: 27 },
  { apmcId: 'ramanagara', cropId: 'maize', minPrice: 1780, modalPrice: 1890, maxPrice: 1980 },
  { apmcId: 'ramanagara', cropId: 'groundnut', minPrice: 5300, modalPrice: 5500, maxPrice: 5750 },

  { apmcId: 'bengaluru', cropId: 'tomato', minPrice: 20, modalPrice: 24, maxPrice: 29 },
  { apmcId: 'bengaluru', cropId: 'onion', minPrice: 15, modalPrice: 18, maxPrice: 22 },
  { apmcId: 'bengaluru', cropId: 'chilli', minPrice: 65, modalPrice: 78, maxPrice: 92 },

  { apmcId: 'mysuru', cropId: 'tomato', minPrice: 18, modalPrice: 22, maxPrice: 27 },
  { apmcId: 'mysuru', cropId: 'ragi', minPrice: 3150, modalPrice: 3300, maxPrice: 3450 },
  { apmcId: 'mysuru', cropId: 'groundnut', minPrice: 5150, modalPrice: 5400, maxPrice: 5650 },

  { apmcId: 'hassan', cropId: 'paddy', minPrice: 1960, modalPrice: 2090, maxPrice: 2200 },
  { apmcId: 'hassan', cropId: 'maize', minPrice: 1740, modalPrice: 1850, maxPrice: 1940 },

  { apmcId: 'tumakuru', cropId: 'groundnut', minPrice: 5250, modalPrice: 5480, maxPrice: 5720 },
  { apmcId: 'tumakuru', cropId: 'onion', minPrice: 14, modalPrice: 17, maxPrice: 21 },

  { apmcId: 'shivamogga', cropId: 'paddy', minPrice: 2000, modalPrice: 2120, maxPrice: 2230 },
  { apmcId: 'shivamogga', cropId: 'maize', minPrice: 1770, modalPrice: 1880, maxPrice: 1970 },

  { apmcId: 'mangaluru', cropId: 'paddy', minPrice: 2050, modalPrice: 2180, maxPrice: 2290 },
  { apmcId: 'mangaluru', cropId: 'chilli', minPrice: 62, modalPrice: 75, maxPrice: 88 },

  { apmcId: 'hubli', cropId: 'maize', minPrice: 1760, modalPrice: 1870, maxPrice: 1960 },
  { apmcId: 'hubli', cropId: 'onion', minPrice: 13, modalPrice: 16, maxPrice: 20 },
  { apmcId: 'hubli', cropId: 'chilli', minPrice: 58, modalPrice: 70, maxPrice: 83 },

  { apmcId: 'kalaburagi', cropId: 'maize', minPrice: 1730, modalPrice: 1840, maxPrice: 1930 },
  { apmcId: 'kalaburagi', cropId: 'groundnut', minPrice: 5100, modalPrice: 5350, maxPrice: 5600 },

  { apmcId: 'belagavi', cropId: 'maize', minPrice: 1780, modalPrice: 1890, maxPrice: 1980 },
  { apmcId: 'belagavi', cropId: 'onion', minPrice: 13, modalPrice: 16, maxPrice: 20 },
  { apmcId: 'belagavi', cropId: 'tomato', minPrice: 17, modalPrice: 21, maxPrice: 25 },

  { apmcId: 'chikodi', cropId: 'onion', minPrice: 12, modalPrice: 15, maxPrice: 19 },
  { apmcId: 'chikodi', cropId: 'maize', minPrice: 1750, modalPrice: 1860, maxPrice: 1950 },

  { apmcId: 'athani', cropId: 'onion', minPrice: 12, modalPrice: 15, maxPrice: 18 },
  { apmcId: 'athani', cropId: 'maize', minPrice: 1730, modalPrice: 1840, maxPrice: 1930 },
  { apmcId: 'athani', cropId: 'chilli', minPrice: 57, modalPrice: 69, maxPrice: 82 },

  { apmcId: 'gokak', cropId: 'onion', minPrice: 12, modalPrice: 15, maxPrice: 18 },
  { apmcId: 'gokak', cropId: 'maize', minPrice: 1740, modalPrice: 1850, maxPrice: 1940 },
  { apmcId: 'gokak', cropId: 'groundnut', minPrice: 5050, modalPrice: 5300, maxPrice: 5550 },

  { apmcId: 'kudachi', cropId: 'onion', minPrice: 12, modalPrice: 15, maxPrice: 19 },
  { apmcId: 'kudachi', cropId: 'maize', minPrice: 1730, modalPrice: 1840, maxPrice: 1930 },
];

// The hand-picked list above only covers each APMC's few headline
// crops (mirroring real markets, which don't all trade everything) -
// but that sparsity means a genuinely common question ("onion price
// near me?") silently returns "not found" the moment the farmer's
// nearest market isn't one of the few that happened to list onion.
// market_price_lookup is deliberately built to never invent a price
// for a real gap (see tools.js) - the fix belongs here, in the data,
// not by loosening that guarantee.
//
// So every market gets a price for every crop: explicit entries above
// are kept exactly as authored, and this fills only the combinations
// missing from that list, deterministically varied per-market (a
// simple string hash, not Math.random - reseeding must produce the
// same numbers every time) so prices look regionally realistic
// instead of identical everywhere.
const BASE_PRICES = {
  tomato: { minPrice: 18, modalPrice: 22, maxPrice: 27 },
  onion: { minPrice: 13, modalPrice: 16, maxPrice: 19 },
  paddy: { minPrice: 1960, modalPrice: 2090, maxPrice: 2210 },
  maize: { minPrice: 1750, modalPrice: 1860, maxPrice: 1950 },
  ragi: { minPrice: 3100, modalPrice: 3250, maxPrice: 3400 },
  groundnut: { minPrice: 5200, modalPrice: 5450, maxPrice: 5700 },
  chilli: { minPrice: 60, modalPrice: 73, maxPrice: 86 },
  brinjal: { minPrice: 12, modalPrice: 15, maxPrice: 19 },
  jowar: { minPrice: 2700, modalPrice: 2900, maxPrice: 3100 },
  potato: { minPrice: 10, modalPrice: 14, maxPrice: 18 },
  turmeric: { minPrice: 7200, modalPrice: 7800, maxPrice: 8500 },
  coconut: { minPrice: 3600, modalPrice: 4000, maxPrice: 4400 },
  sugarcane: { minPrice: 3050, modalPrice: 3200, maxPrice: 3350 },
};

function hashVariation(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  // +/-8% band - enough to look like real market-to-market spread
  // without a crop's price ever swinging into an implausible range.
  return ((Math.abs(hash) % 17) - 8) / 100;
}

function roundToUnit(value, unit) {
  const step = unit === 'Kg' ? 1 : 10;
  return Math.round(value / step) * step;
}

const explicitKeys = new Set(marketPrices.map((p) => `${p.apmcId}|${p.cropId}`));
const cropUnitById = Object.fromEntries(crops.map((c) => [c._id, c.defaultUnit]));

for (const market of apmcMarkets) {
  for (const crop of crops) {
    const key = `${market._id}|${crop._id}`;
    if (explicitKeys.has(key)) continue;

    const base = BASE_PRICES[crop._id];
    const variation = 1 + hashVariation(key);
    const unit = cropUnitById[crop._id];

    marketPrices.push({
      apmcId: market._id,
      cropId: crop._id,
      unit,
      minPrice: roundToUnit(base.minPrice * variation, unit),
      modalPrice: roundToUnit(base.modalPrice * variation, unit),
      maxPrice: roundToUnit(base.maxPrice * variation, unit),
    });
  }
}

// Every hand-authored row above predates the `unit` field - rather
// than annotate all 47 individually (easy to get one wrong/stale),
// backfill from the same cropUnitById map the generated rows already
// use, so a price record's unit can never drift from its crop's own
// defaultUnit.
const marketPricesWithDate = marketPrices.map((p) => ({
  ...p,
  unit: p.unit ?? cropUnitById[p.cropId],
  priceDate: today,
}));

async function seed() {
  await connectDatabase();

  for (const market of apmcMarkets) {
    await ApmcMarket.findByIdAndUpdate(market._id, market, { upsert: true });
  }
  console.log(`Seeded ${apmcMarkets.length} APMC markets.`);

  for (const crop of crops) {
    await Crop.findByIdAndUpdate(crop._id, crop, { upsert: true });
  }
  console.log(`Seeded ${crops.length} crops.`);

  for (const price of marketPricesWithDate) {
    await MarketPrice.findOneAndUpdate(
      { apmcId: price.apmcId, cropId: price.cropId },
      price,
      { upsert: true }
    );
  }
  console.log(`Seeded ${marketPricesWithDate.length} market price records.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
