import { API_BASE_URL } from '../config/apiConfig';

// storageProvider.saveFile() (backend) deliberately returns a
// relative path like "/uploads/xyz.jpg", not an absolute URL - it
// stays valid across dev/staging/prod without baking in one
// environment's origin, since the backend serves that same path
// itself. The frontend and backend can be different origins (e.g.
// Vite dev server on :5173, API on :8123), so a relative path handed
// straight to <img src> resolves against the wrong origin - this is
// the fix for that, applied once, reused everywhere an uploaded image
// is displayed.
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export function resolveImageUrl(url) {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${BACKEND_ORIGIN}${url}`;
}
