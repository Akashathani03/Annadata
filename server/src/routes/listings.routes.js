import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';
import {
  getListings,
  getMyListings,
  getMySales,
  getListingById,
  getSeller,
  postListing,
  patchListing,
  patchListingSold,
  deleteListing,
} from '../controllers/listings.controller.js';

// Local to this route file, matching the same local-not-shared
// convention already established in shops.routes.js and
// message.routes.js.
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_SIZE_BYTES } });

const router = Router();

// Public browse/detail - matching Market Prices/Near Shop/Schemes'
// established precedent. getListingById handles its own optional
// owner check internally (see the controller) for draft visibility.
router.get('/', getListings);
router.get('/mine', requireAuth, getMyListings);
router.get('/sales', requireAuth, getMySales);
router.get('/:id', getListingById);
router.get('/:id/seller', getSeller);

router.post('/', requireAuth, rateLimit('IMAGE_UPLOAD'), upload.single('photo'), postListing);
router.patch('/:id', requireAuth, patchListing);
router.patch('/:id/sold', requireAuth, patchListingSold);
router.delete('/:id', requireAuth, deleteListing);

export default router;
