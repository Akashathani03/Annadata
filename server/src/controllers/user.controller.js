import { sendSuccess } from '../utils/apiResponse.js';
import { getUserProfile, updateUserProfile } from '../services/user/user.service.js';

// Now follows the same Controller -> Service -> Repository pattern as
// every other domain, per the backend audit - the controller only
// handles req/res, all business logic (field allowlisting, not-found
// handling) lives in user.service.js.

export async function getMe(req, res, next) {
  try {
    const user = await getUserProfile(req.user.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const user = await updateUserProfile(req.user.id, req.body, req.file);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
