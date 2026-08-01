// Each entry mirrors the planned market_prices document shape:
// { apmc: ref(ApmcMarket), crop: ref(CropCatalog), minPrice, modalPrice, maxPrice, priceDate }
const today = new Date().toISOString().slice(0, 10);

export const marketPrices = [
  { apmcId: 'mandya', cropId: 'tomato', minPrice: 18, modalPrice: 22, maxPrice: 26, priceDate: today },
  { apmcId: 'mandya', cropId: 'onion', minPrice: 14, modalPrice: 17, maxPrice: 20, priceDate: today },
  { apmcId: 'mandya', cropId: 'paddy', minPrice: 1980, modalPrice: 2100, maxPrice: 2210, priceDate: today },
  { apmcId: 'mandya', cropId: 'maize', minPrice: 1750, modalPrice: 1860, maxPrice: 1950, priceDate: today },
  { apmcId: 'mandya', cropId: 'ragi', minPrice: 3100, modalPrice: 3250, maxPrice: 3400, priceDate: today },
  { apmcId: 'mandya', cropId: 'groundnut', minPrice: 5200, modalPrice: 5450, maxPrice: 5700, priceDate: today },
  { apmcId: 'mandya', cropId: 'chilli', minPrice: 60, modalPrice: 72, maxPrice: 85, priceDate: today },
  { apmcId: 'mandya', cropId: 'brinjal', minPrice: 12, modalPrice: 15, maxPrice: 19, priceDate: today },

  { apmcId: 'maddur', cropId: 'tomato', minPrice: 17, modalPrice: 21, maxPrice: 25, priceDate: today },
  { apmcId: 'maddur', cropId: 'onion', minPrice: 13, modalPrice: 16, maxPrice: 19, priceDate: today },
  { apmcId: 'maddur', cropId: 'paddy', minPrice: 1950, modalPrice: 2080, maxPrice: 2190, priceDate: today },
  { apmcId: 'maddur', cropId: 'ragi', minPrice: 3050, modalPrice: 3200, maxPrice: 3350, priceDate: today },

  { apmcId: 'ramanagara', cropId: 'tomato', minPrice: 19, modalPrice: 23, maxPrice: 27, priceDate: today },
  { apmcId: 'ramanagara', cropId: 'maize', minPrice: 1780, modalPrice: 1890, maxPrice: 1980, priceDate: today },
  { apmcId: 'ramanagara', cropId: 'groundnut', minPrice: 5300, modalPrice: 5500, maxPrice: 5750, priceDate: today },

  { apmcId: 'bengaluru', cropId: 'tomato', minPrice: 20, modalPrice: 24, maxPrice: 29, priceDate: today },
  { apmcId: 'bengaluru', cropId: 'onion', minPrice: 15, modalPrice: 18, maxPrice: 22, priceDate: today },
  { apmcId: 'bengaluru', cropId: 'chilli', minPrice: 65, modalPrice: 78, maxPrice: 92, priceDate: today },

  { apmcId: 'mysuru', cropId: 'tomato', minPrice: 18, modalPrice: 22, maxPrice: 27, priceDate: today },
  { apmcId: 'mysuru', cropId: 'ragi', minPrice: 3150, modalPrice: 3300, maxPrice: 3450, priceDate: today },
  { apmcId: 'mysuru', cropId: 'groundnut', minPrice: 5150, modalPrice: 5400, maxPrice: 5650, priceDate: today },

  { apmcId: 'hassan', cropId: 'paddy', minPrice: 1960, modalPrice: 2090, maxPrice: 2200, priceDate: today },
  { apmcId: 'hassan', cropId: 'maize', minPrice: 1740, modalPrice: 1850, maxPrice: 1940, priceDate: today },

  { apmcId: 'tumakuru', cropId: 'groundnut', minPrice: 5250, modalPrice: 5480, maxPrice: 5720, priceDate: today },
  { apmcId: 'tumakuru', cropId: 'onion', minPrice: 14, modalPrice: 17, maxPrice: 21, priceDate: today },

  { apmcId: 'shivamogga', cropId: 'paddy', minPrice: 2000, modalPrice: 2120, maxPrice: 2230, priceDate: today },
  { apmcId: 'shivamogga', cropId: 'maize', minPrice: 1770, modalPrice: 1880, maxPrice: 1970, priceDate: today },

  { apmcId: 'mangaluru', cropId: 'paddy', minPrice: 2050, modalPrice: 2180, maxPrice: 2290, priceDate: today },
  { apmcId: 'mangaluru', cropId: 'chilli', minPrice: 62, modalPrice: 75, maxPrice: 88, priceDate: today },

  { apmcId: 'hubli', cropId: 'maize', minPrice: 1760, modalPrice: 1870, maxPrice: 1960, priceDate: today },
  { apmcId: 'hubli', cropId: 'onion', minPrice: 13, modalPrice: 16, maxPrice: 20, priceDate: today },
  { apmcId: 'hubli', cropId: 'chilli', minPrice: 58, modalPrice: 70, maxPrice: 83, priceDate: today },

  { apmcId: 'kalaburagi', cropId: 'maize', minPrice: 1730, modalPrice: 1840, maxPrice: 1930, priceDate: today },
  { apmcId: 'kalaburagi', cropId: 'groundnut', minPrice: 5100, modalPrice: 5350, maxPrice: 5600, priceDate: today },

  { apmcId: 'belagavi', cropId: 'maize', minPrice: 1780, modalPrice: 1890, maxPrice: 1980, priceDate: today },
  { apmcId: 'belagavi', cropId: 'onion', minPrice: 13, modalPrice: 16, maxPrice: 20, priceDate: today },
  { apmcId: 'belagavi', cropId: 'tomato', minPrice: 17, modalPrice: 21, maxPrice: 25, priceDate: today },

  { apmcId: 'chikodi', cropId: 'onion', minPrice: 12, modalPrice: 15, maxPrice: 19, priceDate: today },
  { apmcId: 'chikodi', cropId: 'maize', minPrice: 1750, modalPrice: 1860, maxPrice: 1950, priceDate: today },
];

// Small deterministic recent-price history per crop+apmc so the detail
// screen has a table to show. Swapped for real historical data later.
export function buildRecentHistory(basePrice) {
  const todayDate = new Date();
  return [0, 1, 2].map((daysAgo) => {
    const date = new Date(todayDate);
    date.setDate(date.getDate() - daysAgo);
    const drift = daysAgo * 0.02;
    return {
      date: date.toISOString().slice(0, 10),
      minPrice: Math.round(basePrice.minPrice * (1 - drift)),
      modalPrice: Math.round(basePrice.modalPrice * (1 - drift)),
      maxPrice: Math.round(basePrice.maxPrice * (1 - drift)),
    };
  });
}
