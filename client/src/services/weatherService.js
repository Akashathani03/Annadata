import { apiRequest } from './apiClient';

// Step 8: internals now call the real Weather domain service
// (backend proxy around Open-Meteo) instead of hitting Open-Meteo
// directly from the browser. Function name, signature, and return
// shape are all unchanged - WeatherCard.jsx needs no changes at all.
//
// The original implementation never threw (its own internal
// try/catch always resolved to null or data) - WeatherCard.jsx calls
// this with no .catch() at all, relying on exactly that guarantee.
// Preserving it here: if our own backend is unreachable (not just
// Open-Meteo), this still resolves to null rather than throwing
// uncaught, same as before.
export async function fetchCurrentWeather(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;

  try {
    const { weather } = await apiRequest(`/weather/current?lat=${lat}&lon=${lon}`);
    return weather;
  } catch {
    return null;
  }
}
