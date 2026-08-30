const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Exact same collapse of Open-Meteo's WMO weather codes into the small
// set of conditions actually displayed, ported unchanged from the
// frontend's weatherService.js - same icons, same translation keys,
// so nothing about what a farmer sees needs to differ now that this
// runs server-side.
// Full WMO code table (per Open-Meteo's docs) is deliberately covered
// here, even codes that essentially never fire for Karnataka's
// coordinates (snow, freezing rain) - a code silently missing from
// this map falls through to the "partly cloudy" default below, which
// is actively wrong (not just imprecise) for anything in the drizzle/
// rain-shower/hail families - e.g. codes 81/82 (moderate/violent rain
// showers) and 96/99 (thunderstorm with hail) previously fell through
// to "partly cloudy" for lack of an explicit entry, which is exactly
// the kind of severe-weather event a farmer most needs a correct
// reading for. Snow-family codes (71/73/75/77/85/86) map to "cloudy"
// rather than inventing an unused snow condition/icon for a climate
// that doesn't get it.
const WEATHER_CODE_MAP = {
  0: { icon: '☀️', conditionKey: 'weather:conditions.sunny' },
  1: { icon: '🌤️', conditionKey: 'weather:conditions.partlyCloudy' },
  2: { icon: '🌤️', conditionKey: 'weather:conditions.partlyCloudy' },
  3: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  45: { icon: '🌫️', conditionKey: 'weather:conditions.foggy' },
  48: { icon: '🌫️', conditionKey: 'weather:conditions.foggy' },
  51: { icon: '🌦️', conditionKey: 'weather:conditions.rainy' },
  53: { icon: '🌦️', conditionKey: 'weather:conditions.rainy' },
  55: { icon: '🌦️', conditionKey: 'weather:conditions.rainy' },
  56: { icon: '🌦️', conditionKey: 'weather:conditions.rainy' },
  57: { icon: '🌦️', conditionKey: 'weather:conditions.rainy' },
  61: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  63: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  65: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  66: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  67: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  71: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  73: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  75: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  77: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  80: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  81: { icon: '🌧️', conditionKey: 'weather:conditions.rainy' },
  82: { icon: '⛈️', conditionKey: 'weather:conditions.stormy' },
  85: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  86: { icon: '☁️', conditionKey: 'weather:conditions.cloudy' },
  95: { icon: '⛈️', conditionKey: 'weather:conditions.stormy' },
  96: { icon: '⛈️', conditionKey: 'weather:conditions.stormy' },
  99: { icon: '⛈️', conditionKey: 'weather:conditions.stormy' },
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
