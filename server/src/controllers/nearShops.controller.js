import { sendSuccess } from '../utils/apiResponse.js';
import * as nearShopsService from '../services/domain/shops/nearShops.service.js';

export async function getNearbyShops(req, res, next) {
  try {
    const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
    const lng = req.query.lng != null ? Number(req.query.lng) : undefined;
    const shops = await nearShopsService.getNearbyShops({ query: req.query.q, buyerLat: lat, buyerLng: lng });
    sendSuccess(res, { shops });
  } catch (err) {
    next(err);
  }
}

export async function getShopDetail(req, res, next) {
  try {
    const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
    const lng = req.query.lng != null ? Number(req.query.lng) : undefined;
    const detail = await nearShopsService.getShopDetail(req.params.shopId, { buyerLat: lat, buyerLng: lng });
    sendSuccess(res, { detail });
  } catch (err) {
    next(err);
  }
}

export async function searchProductsAcrossShops(req, res, next) {
  try {
    const results = await nearShopsService.searchProductsAcrossShops(req.query.q);
    sendSuccess(res, { results });
  } catch (err) {
    next(err);
  }
}

export async function getShopPricesForItem(req, res, next) {
  try {
    const prices = await nearShopsService.getShopPricesForItem(req.query.itemId);
    sendSuccess(res, { prices });
  } catch (err) {
    next(err);
  }
}

export async function getShopCountForItem(req, res, next) {
  try {
    const count = await nearShopsService.getShopCountForItem(req.query.itemId);
    sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
}
