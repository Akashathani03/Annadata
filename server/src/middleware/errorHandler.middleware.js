import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

// Mounted after every route (see app.js) - Express routes any error
// passed to next(err), or thrown inside an async handler wrapped
// correctly, here. This is the single enforcement point for two rules
// from the Security & Deployment session: never leak raw error/stack
// text to the client, and always use the standard error envelope.
export function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', `No route matches ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    // Expected, well-formed failure - safe to return err.message as-is,
    // since ApiError is only ever thrown deliberately with farmer/
    // developer-safe text, never built from a raw caught exception.
    logger.warn({ code: err.code, statusCode: err.statusCode }, err.message);
    return sendError(res, err.statusCode, err.code, err.message);
  }

  if (err instanceof multer.MulterError) {
    // A known, expected failure category (file too large, unexpected
    // field name, etc.) - same treatment as ApiError, just originating
    // from multer instead of being thrown by our own code. Without
    // this, an oversized upload would surface as a raw 500 instead of
    // a clean, farmer-safe validation error (Step 5).
    logger.warn({ code: err.code }, err.message);
    return sendError(res, 400, 'INVALID_FILE_UPLOAD', err.message);
  }

  // Unexpected error (a bug, a thrown library error) - log the real
  // detail server-side for debugging, but never return it to the
  // client. This is the actual mechanism behind the PDS's "never
  // surface technical error text to the farmer" rule.
  logger.error({ err }, 'Unhandled error');
  return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}
