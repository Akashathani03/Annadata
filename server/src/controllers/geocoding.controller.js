import { sendSuccess } from '../utils/apiResponse.js';
import * as geocodingService from '../services/domain/geocoding/geocoding.service.js';

export async function getReverseGeocode(req, res, next) {
  try {
    const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
    const lng = req.query.lng != null ? Number(req.query.lng) : undefined;
    const address = await geocodingService.reverseGeocode(lat, lng);
    sendSuccess(res, { address });
  } catch (err) {
    next(err);
  }
}

export async function getForwardGeocode(req, res, next) {
  try {
    const { village, taluk, district, state } = req.query;
    const location = await geocodingService.forwardGeocode({ village, taluk, district, state });
    sendSuccess(res, { location });
  } catch (err) {
    next(err);
  }
}

export async function getVillageSuggestions(req, res, next) {
  try {
    const { taluk, district, state } = req.query;
    const villages = await geocodingService.getVillageSuggestions({ taluk, district, state });
    sendSuccess(res, { villages });
  } catch (err) {
    next(err);
  }
}
