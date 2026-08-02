import { apiRequest } from './apiClient';

// Step 7: internals now call the real Market Prices domain service
// (backend). Every exported function name and signature below is
// unchanged from before - this file's own original comment already
// anticipated this exact swap ("each function body becomes a fetch()
// call - callers do not change"), and that's exactly what happened.
// This is shared, load-bearing infrastructure beyond just the 3
// Market Prices screens - Sell Crop's CreateListing/MyListings/
// ListingDetail and Buy Crops' Detail all import from this same file,
// and now transparently receive real backend data too, per the
// approved plan.

export async function getApmcMarkets({ lat, lng } = {}) {
  const query = lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : '';
  const { markets } = await apiRequest(`/market-prices/apmc-markets${query}`);
  return markets;
}

export async function getCropPricesForApmc(apmcId) {
  const { prices } = await apiRequest(`/market-prices/apmc-markets/${apmcId}/prices`);
  return prices;
}

export async function getCropPriceDetail(apmcId, cropId) {
  const { detail } = await apiRequest(`/market-prices/apmc-markets/${apmcId}/prices/${cropId}`);
  return detail;
}

export async function getCropCatalog() {
  const { crops } = await apiRequest('/market-prices/crops');
  return crops;
}
