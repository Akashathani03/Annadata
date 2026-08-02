import { sendSuccess } from '../utils/apiResponse.js';
import * as marketPricesService from '../services/domain/marketPrices/marketPrices.service.js';

export async function getApmcMarkets(req, res, next) {
  try {
    const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
    const lng = req.query.lng != null ? Number(req.query.lng) : undefined;
    const markets = await marketPricesService.getApmcMarkets({ lat, lng });
    sendSuccess(res, { markets });
  } catch (err) {
    next(err);
  }
}

export async function searchApmcMarkets(req, res, next) {
  try {
    const markets = await marketPricesService.searchApmcMarkets(req.query.q);
    sendSuccess(res, { markets });
  } catch (err) {
    next(err);
  }
}

export async function getCropCatalog(req, res, next) {
  try {
    const crops = await marketPricesService.getCropCatalog();
    sendSuccess(res, { crops });
  } catch (err) {
    next(err);
  }
}

export async function searchCrops(req, res, next) {
  try {
    const crops = await marketPricesService.searchCrops(req.query.q);
    sendSuccess(res, { crops });
  } catch (err) {
    next(err);
  }
}

export async function getCropPricesForApmc(req, res, next) {
  try {
    const prices = await marketPricesService.getCropPricesForApmc(req.params.apmcId);
    sendSuccess(res, { prices });
  } catch (err) {
    next(err);
  }
}

export async function getCropPriceDetail(req, res, next) {
  try {
    const detail = await marketPricesService.getCropPriceDetail(req.params.apmcId, req.params.cropId);
    sendSuccess(res, { detail });
  } catch (err) {
    next(err);
  }
}
