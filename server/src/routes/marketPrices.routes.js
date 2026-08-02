import { Router } from 'express';
import {
  getApmcMarkets,
  searchApmcMarkets,
  getCropCatalog,
  searchCrops,
  getCropPricesForApmc,
  getCropPriceDetail,
} from '../controllers/marketPrices.controller.js';

// No requireAuth on any of these - Market Prices is a public,
// unauthenticated feature in the current frontend (confirmed by
// inspection: none of ApmcList/CropList/CropDetail have an auth
// guard), so these endpoints preserve that exact existing behavior.
const router = Router();

router.get('/apmc-markets/search', searchApmcMarkets);
router.get('/apmc-markets', getApmcMarkets);
router.get('/apmc-markets/:apmcId/prices/:cropId', getCropPriceDetail);
router.get('/apmc-markets/:apmcId/prices', getCropPricesForApmc);
router.get('/crops/search', searchCrops);
router.get('/crops', getCropCatalog);

export default router;
