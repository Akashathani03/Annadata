import { MarketPrice } from '../models/MarketPrice.js';

export async function findByApmc(apmcId) {
  return MarketPrice.find({ apmcId });
}

export async function findOne(apmcId, cropId) {
  return MarketPrice.findOne({ apmcId, cropId });
}
