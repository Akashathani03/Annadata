import { API_BASE_URL } from '../config/apiConfig';
import { getStoredToken } from '../repositories/sessionRepository';

// The one place every real API call flows through - attaches the auth
// header if a token exists, throws consistently on a non-2xx response
// (unwrapping the backend's { success:false, error:{code,message} }
// shape into a real JS Error), and is the single spot a future change
// to how tokens are attached/refreshed would happen. Both authService
// and agroAIService import this rather than each hand-rolling fetch().
export async function apiRequest(path, { method = 'GET', body, isFormData = false } = {}) {
  const token = await getStoredToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.error?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.code = json?.error?.code;
    error.status = res.status;
    throw error;
  }

  return json.data;
}
