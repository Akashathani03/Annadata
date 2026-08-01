// The one place that constructs a response body - every endpoint
// (Agro AI and every future shared module) uses these two functions
// instead of building { success, ... } by hand, so the envelope shape
// can never drift between routes.

export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function sendError(res, statusCode, code, message) {
  return res.status(statusCode).json({ success: false, error: { code, message } });
}
