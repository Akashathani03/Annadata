import { Router } from 'express';
import {
  getNearbyShops,
  getShopDetail,
  searchProductsAcrossShops,
  getShopPricesForItem,
  getShopCountForItem,
} from '../controllers/nearShops.controller.js';

// No requireAuth on any of these - NearShop/Browse.jsx and Detail.jsx
// have no auth guard (confirmed by inspection), same public-browsing
// precedent as Market Prices.
const router = Router();

router.get('/products/search', searchProductsAcrossShops);
router.get('/products/prices', getShopPricesForItem);
router.get('/products/count', getShopCountForItem);
router.get('/:shopId', getShopDetail);
router.get('/', getNearbyShops);

export default router;
