import { ApiError } from '../../../utils/ApiError.js';
import { storageProvider } from '../../../storage/index.js';
import * as shopRepository from '../../../repositories/shop.repository.js';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function getMyShop(ownerId) {
  return shopRepository.findByOwnerId(ownerId);
}

export async function getShopById(id) {
  return shopRepository.findById(id);
}

// A shop is "active" (visible in Near Shop) once the required fields
// are filled - exact same rule as the frontend's existing saveShop,
// ported unchanged, not reinterpreted.
function determineStatus(patch) {
  const isComplete = !!(patch.shopName && patch.ownerName && patch.phone && patch.whatsapp && patch.location);
  return isComplete ? 'active' : 'incomplete';
}

// imageFile is the raw multer file object when a new photo was
// uploaded, or undefined if the owner didn't change their photo this
// save (in which case patch.photoUrl, if present, is trusted as an
// already-stored URL from a previous save - never a fresh client
// claim about an arbitrary URL, since the only way photoUrl ever
// becomes a real URL is via this same upload path).
export async function saveShop(ownerId, patch, imageFile) {
  const nextPatch = { ...patch };

  if (imageFile) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.mimetype)) {
      throw new ApiError(
        400,
        'INVALID_FILE_TYPE',
        `Unsupported image type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}.`
      );
    }
    const saved = await storageProvider.saveFile(imageFile.buffer, { mimeType: imageFile.mimetype });
    nextPatch.photoUrl = saved.url;
  }

  nextPatch.status = determineStatus(nextPatch);

  return shopRepository.upsertByOwnerId(ownerId, nextPatch);
}
