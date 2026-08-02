const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Exact same collapse of Open-Meteo's WMO weather codes into the small
// set of conditions actually displayed, ported unchanged from the
// frontend's weatherService.js - same icons, same translation keys,
// so nothing about what a farmer sees needs to differ now that this
// runs server-side.
const WEATHER_CODE_MAP = {
  0: { icon: '☀️', conditionKey: 'weather:conditions.sunny' },
  1: { icon: '🌤️', conditionKey: 'weather:conditions.partlyCloudy' },
  2: { icon: '🌤️', conditionKey: 'weather:conditions.partlyCloudy' },
  3: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  45: { icon: '🌫️', conditionKey: 'weather:conditions.foggy' },
  48: { icon: '🌫️', conditionKey: 'weather:conditions.foggy' },
  51: { icon: '🌦️', conditionKey: 'weather:conditions.rainy' },
  61: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  63: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  65: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  80: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  95: { icon: '⛈️', conditionKey: 'weather:conditions.stormy' },
};

function resolveWeatherCode(code) {
  return WEATHER_CODE_MAP[code] || { icon: '🌤️', conditionKey: 'weather:conditions.partlyCloudy' };
}

// Mirrors the frontend's existing fetchCurrentWeather exactly,
// including its failure behavior: returns null (never throws) if
// coordinates are missing/invalid or the upstream provider fails, so
// the caller can hide the card gracefully - this is a deliberate
// design match, not a missing error path. A weather outage should
// never disrupt the rest of the app, on the backend any more than it
// did on the frontend.
export async function getCurrentWeather({ lat, lon }) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code',
    timezone: 'auto',
  });

  try {
    const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const current = data.current;
    if (!current) return null;

    const { icon, conditionKey } = resolveWeatherCode(current.weather_code);

    return {
      temperatureC: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      rainChance: Math.round(current.precipitation_probability ?? 0),
      icon,
      conditionKey,
    };
  } catch {
    return null;
  }
}
