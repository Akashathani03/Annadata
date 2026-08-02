import { sendSuccess } from '../utils/apiResponse.js';
import * as weatherService from '../services/domain/weather/weather.service.js';

export async function getCurrentWeather(req, res, next) {
  try {
    const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
    const lon = req.query.lon != null ? Number(req.query.lon) : undefined;
    const weather = await weatherService.getCurrentWeather({ lat, lon });
    sendSuccess(res, { weather });
  } catch (err) {
    next(err);
  }
}
