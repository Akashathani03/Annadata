import { sendSuccess } from '../utils/apiResponse.js';
import * as shopProductsService from '../services/domain/shops/shopProducts.service.js';

export async function getMyProducts(req, res, next) {
  try {
    const products = await shopProductsService.getMyProducts(req.user.id, req.params.shopId);
    sendSuccess(res, { products });
  } catch (err) {
    next(err);
  }
}

export async function addProducts(req, res, next) {
  try {
    const products = await shopProductsService.addProducts(req.user.id, req.params.shopId, req.body.items);
    sendSuccess(res, { products }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await shopProductsService.updateProduct(req.user.id, req.params.id, req.body);
    sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
}

export async function toggleAvailability(req, res, next) {
  try {
    const product = await shopProductsService.toggleAvailability(req.user.id, req.params.id);
    sendSuccess(res, { product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const deleted = await shopProductsService.deleteProduct(req.user.id, req.params.id);
    sendSuccess(res, { deleted });
  } catch (err) {
    next(err);
  }
}
