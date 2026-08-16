import jwt from 'jsonwebtoken';
import { sendSuccess } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import * as listingsService from '../services/domain/listings/listings.service.js';

export async function getListings(req, res, next) {
  try {
    const result = await listingsService.getListings({
      category: req.query.category,
      query: req.query.q,
      page: req.query.page != null ? Number(req.query.page) : undefined,
      limit: req.query.limit != null ? Number(req.query.limit) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMyListings(req, res, next) {
  try {
    const result = await listingsService.getMyListings(req.user.id, {
      category: req.query.category,
      status: req.query.status,
      page: req.query.page != null ? Number(req.query.page) : undefined,
      limit: req.query.limit != null ? Number(req.query.limit) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMySales(req, res, next) {
  try {
    const result = await listingsService.getMySales(req.user.id, {
      page: req.query.page != null ? Number(req.query.page) : undefined,
      limit: req.query.limit != null ? Number(req.query.limit) : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// This route is public (no requireAuth) - but a draft listing is only
// ever visible to its own owner. Rather than add a new "optional auth"
// middleware (a genuinely new pattern not used anywhere else in this
// backend) or require auth on a route that's public for every other
// case, this checks for a token locally, entirely self-contained to
// this one controller. An invalid or missing token is never rejected
// here - it just means "anonymous viewer", same as not sending one at
// all; only the service layer's own visibility check (draft ->
// owner-only) uses this. Shared by both getListingById and getSeller
// below, since both need the exact same "who's asking" determination.
function getViewerIdFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  try {
    const decoded = jwt.verify(authHeader.slice(7), env.jwtSecret, { algorithms: ['HS256'] });
    return decoded.sub;
  } catch {
    return undefined;
  }
}

export async function getListingById(req, res, next) {
  try {
    const viewerId = getViewerIdFromRequest(req);
    const listing = await listingsService.getListingById(req.params.id, viewerId);
    sendSuccess(res, { listing });
  } catch (err) {
    next(err);
  }
}

// Purpose-specific (per approval): only a seller's display name, never
// a general getUserById. Same draft-visibility rule as getListingById
// above - a draft's seller is no more visible than the draft itself.
export async function getSeller(req, res, next) {
  try {
    const viewerId = getViewerIdFromRequest(req);
    const seller = await listingsService.getListingSeller(req.params.id, viewerId);
    sendSuccess(res, { seller });
  } catch (err) {
    next(err);
  }
}

export async function postListing(req, res, next) {
  try {
    const listing = await listingsService.createListing(req.user.id, req.body, req.files);
    sendSuccess(res, { listing }, 201);
  } catch (err) {
    next(err);
  }
}

export async function patchListing(req, res, next) {
  try {
    const listing = await listingsService.updateListing(req.user.id, req.params.id, req.body);
    sendSuccess(res, { listing });
  } catch (err) {
    next(err);
  }
}

export async function patchListingSold(req, res, next) {
  try {
    const listing = await listingsService.markListingSold(req.user.id, req.params.id, req.body);
    sendSuccess(res, { listing });
  } catch (err) {
    next(err);
  }
}

export async function deleteListing(req, res, next) {
  try {
    const deleted = await listingsService.deleteListing(req.user.id, req.params.id);
    sendSuccess(res, { deleted });
  } catch (err) {
    next(err);
  }
}
