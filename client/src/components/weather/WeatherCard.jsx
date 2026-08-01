import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCurrentWeather } from '../../services/weatherService';
import './WeatherCard.css';

// Compact daily-summary card for the Home screen. Deliberately minimal:
// icon + temperature + condition on one line, rain chance + humidity on
// a second, smaller line. Renders nothing (not even a loading skeleton)
// on failure, so a weather outage never disrupts the navigation hub.
export default function WeatherCard({ lat, lon, locationLabel }) {
  const { t } = useTranslation('weather');
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetchCurrentWeather(lat, lon).then((result) => {
      if (cancelled) return;
      if (result) {
        setWeather(result);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  if (status === 'error') return null;

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
          <span className="weather-temp">{weather.temperatureC}°C</span>
          <span className="weather-condition">{t(weather.conditionKey)}</span>
        </div>
      </div>
      <div className="weather-meta">
        <span>{t('rainChance')} {weather.rainChance}%</span>
        <span className="weather-meta-dot">·</span>
        <span>{t('humidity')} {weather.humidity}%</span>
      </div>
      {locationLabel && <span className="weather-location">{locationLabel}</span>}
    </div>
  );
}
