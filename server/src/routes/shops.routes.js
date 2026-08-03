import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getMyShop, saveShop } from '../controllers/shops.controller.js';
import {
  getMyProducts,
  addProducts,
  updateProduct,
  toggleAvailability,
  deleteProduct,
} from '../controllers/shopProducts.controller.js';

// Local to this route file, not imported from Agro AI's conversation
// service - the two domains shouldn't depend on each other even
// though the value happens to match.
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_SIZE_BYTES } });

const router = Router();

// Owner-facing shop management - all authenticated, per the
// "shop owner must be logged in to manage their own shop" requirement.
router.get('/me', requireAuth, getMyShop);
router.put('/me', requireAuth, upload.single('photo'), saveShop);

router.get('/:shopId/products', requireAuth, getMyProducts);
router.post('/:shopId/products', requireAuth, addProducts);
router.patch('/products/:id', requireAuth, updateProduct);
router.patch('/products/:id/toggle-availability', requireAuth, toggleAvailability);
router.delete('/products/:id', requireAuth, deleteProduct);

export default router;
