import { sendSuccess } from '../utils/apiResponse.js';
import * as shopsService from '../services/domain/shops/shops.service.js';

export async function getMyShop(req, res, next) {
  try {
    const shop = await shopsService.getMyShop(req.user.id);
    sendSuccess(res, { shop });
  } catch (err) {
    next(err);
  }
}

export async function saveShop(req, res, next) {
  try {
    const shop = await shopsService.saveShop(req.user.id, req.body, req.file);
    sendSuccess(res, { shop });
  } catch (err) {
    next(err);
  }
}
