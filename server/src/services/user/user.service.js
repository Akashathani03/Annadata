import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { storageProvider } from '../../storage/index.js';
import { findById, updateById } from '../../repositories/user.repository.js';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Same pattern already established in conversation.service.js,
// listings.service.js, shopProducts.service.js, and
// nearShops.service.js - a malformed id is an input-validation
// problem, not a "not found" problem, and should never surface as a
// raw, unhandled Mongoose CastError falling through to a generic 500.
// This one is reached via the JWT's own sub claim rather than a URL
// param (a real, signed token always carries a valid ObjectId), but
// the same principle applies regardless of where the id originates -
// confirmed as a real gap during final audit verification.
function assertValidObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${fieldName} is not a valid id.`);
  }
}

// Same folder pattern as auth.service.js (services/user/, not
// services/domain/) - this is core account management, not a
// farmer-facing business domain like Market Prices or Shops.
// Introduced to close the one gap flagged in the backend audit:
// user.controller.js was the only controller bypassing the service
// layer, calling the repository directly. No behavior change from
// what the controller used to do inline - purely a move.

export async function getUserProfile(userId) {
  assertValidObjectId(userId, 'userId');
  const user = await findById(userId);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  }
  return user;
}

// Explicit allowlist, not a raw pass-through of the request body -
// phone and _id can never be changed via this path. Fields the
// frontend still sends but the User model doesn't have (whatsapp,
// locationSkipped) are silently dropped rather than rejected -
// nothing in the app actually reads them back yet, so this is a safe,
// deliberate simplification, not a bug. Unchanged from the original
// controller-level logic, just relocated.
const UPDATABLE_FIELDS = ['name', 'village', 'taluk', 'district', 'state', 'lat', 'lng', 'language'];

export async function updateUserProfile(userId, payload, imageFile) {
  assertValidObjectId(userId, 'userId');
  const patch = {};
  for (const field of UPDATABLE_FIELDS) {
    if (payload[field] !== undefined) patch[field] = payload[field];
  }

  if (imageFile) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.mimetype)) {
      throw new ApiError(
        400,
        'INVALID_FILE_TYPE',
        `Unsupported image type. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}.`
      );
    }
    const saved = await storageProvider.saveFile(imageFile.buffer, { mimeType: imageFile.mimetype });
    patch.profilePhotoUrl = saved.url;
  }

  const user = await updateById(userId, patch);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  }
  return user;
}
