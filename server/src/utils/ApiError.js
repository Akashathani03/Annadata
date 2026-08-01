// Thrown from anywhere (middleware, and later controllers/services) to
// signal a specific, expected failure - the centralized error handler
// (errorHandler.middleware.js) knows how to turn this into the correct
// HTTP status and the standard error envelope. Unexpected errors
// (bugs, thrown by libraries) aren't ApiErrors - the handler treats
// those as generic 500s, per the "never leak raw errors" rule.
export class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
