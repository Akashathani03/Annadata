import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { findById, updateById } from '../repositories/user.repository.js';

// Small, justified addition for Step 6: the frontend's login flow now
// stores a real token (per Step 5.5), but there was no endpoint to
// fetch the actual profile behind it - only /whoami, which just
// echoes the JWT payload. Reuses the User repository Step 5.5 already
// built; no new model, no new architecture.
export async function getMe(req, res, next) {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
    }
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

// Explicit allowlist, not a raw pass-through of req.body - phone and
// _id can never be changed via this endpoint. Fields the frontend
// still sends but the User model doesn't have (whatsapp,
// locationSkipped) are silently dropped rather than rejected -
// nothing in the app actually reads them back yet, so this is a safe,
// deliberate simplification, not a bug.
const UPDATABLE_FIELDS = ['name', 'village', 'taluk', 'district', 'state', 'lat', 'lng', 'language'];

export async function updateMe(req, res, next) {
  try {
    const patch = {};
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) patch[field] = req.body[field];
    }

    const user = await updateById(req.user.id, patch);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
    }
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
