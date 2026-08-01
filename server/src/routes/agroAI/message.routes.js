import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { postMessage, getMessages, retryMessage } from '../../controllers/agroAI/message.controller.js';
import { MAX_IMAGE_SIZE_BYTES } from '../../services/agroAI/conversation/conversation.service.js';

// memoryStorage - the file arrives as a Buffer on req.file, handed to
// the service layer, which decides what happens to it (storageProvider).
// Multer itself only ever does HTTP-layer parsing, never touches disk
// or the storage abstraction directly - that would put storage
// decisions in the routing layer instead of the service layer.
//
// upload.single('image') only activates for multipart/form-data
// requests - a plain application/json request (Step 4's original
// text-only flow) passes through untouched, so nothing about that
// existing behavior changes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
});

const router = Router();

router.post('/messages', requireAuth, upload.single('image'), postMessage);
router.get('/messages', requireAuth, getMessages);
router.post('/messages/:id/retry', requireAuth, retryMessage);

export default router;
