const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Open-Meteo WMO weather codes collapsed into the small set of
// conditions we actually display, each mapped to an icon + a
// translation key under the "weather" namespace.
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

// Fetches a compact "right now" weather summary for a lat/lon pair.
// Returns null on failure so the UI can hide the card gracefully
// instead of showing broken data.
export async function fetchCurrentWeather(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;

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
