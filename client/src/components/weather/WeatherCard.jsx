import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCurrentWeather } from '../../services/weatherService';
import './WeatherCard.css';

// Compact daily-summary card for the Home screen. Deliberately minimal:
// icon + temperature + condition on one line, rain chance + humidity on
// a second, smaller line. On failure, shows a brief message rather than
// the full card - distinguishing "no location to ask about" from "the
// weather service itself failed" - so a farmer isn't left guessing.
export default function WeatherCard({ lat, lon }) {
  const { t } = useTranslation('weather');
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | no-location

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setStatus('loading');

      // Distinguish "we never had a real location to ask about" from
      // "we asked and the weather service failed" - checked here,
      // before the network call, rather than relying on
      // fetchCurrentWeather's null (which already means either case).
      if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
        if (!cancelled) setStatus('no-location');
        return;
      }

      try {
        const result = await fetchCurrentWeather(lat, lon);

        if (cancelled) return;

        if (result) {
          setWeather(result);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  if (status === 'no-location') {
    return (
      <div className="weather-card weather-card-loading">
        <span className="weather-loading-text">{t('locationUnavailable')}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="weather-card weather-card-loading">
        <span className="weather-loading-text">{t('unavailable')}</span>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="weather-card weather-card-loading">
        <span className="weather-loading-text">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="weather-card">
      <div className="weather-main">
        <span className="weather-icon">{weather.icon}</span>

        <div className="weather-main-text">
          <span className="weather-temp">
            {weather.temperatureC}°C
          </span>

          <span className="weather-condition">
            {t(weather.conditionKey)}
          </span>
        </div>
      </div>

      <div className="weather-meta">
        <span>
          {t('rainChance')} {weather.rainChance}%
        </span>

        <span className="weather-meta-dot">·</span>

        <span>
          {t('humidity')} {weather.humidity}%
        </span>
      </div>
    </div>
  );
}