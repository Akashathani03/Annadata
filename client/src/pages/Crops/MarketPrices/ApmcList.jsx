import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApmcMarkets } from '../../../services/marketPricesService';
import { DEFAULT_LOCATION } from '../../../config/constants';
import { useAuth } from '../../../context/AuthContext';
import BackLink from '../../../components/common/BackLink';
import './MarketPrices.css';

export default function ApmcList() {
  const navigate = useNavigate();
  const { t } = useTranslation('marketPrices');
  const { user } = useAuth();
  const [apmcs, setApmcs] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const VISIBLE_COUNT = 5;

  useEffect(() => {
    let cancelled = false;
    const lat = user?.lat ?? DEFAULT_LOCATION.lat;
    const lng = user?.lng ?? DEFAULT_LOCATION.lng;
    getApmcMarkets({ lat, lng }).then((result) => {
      if (!cancelled) setApmcs(result);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // getApmcMarkets already returns markets sorted nearest-first (per
  // the backend service), so the first 5 are genuinely the closest,
  // not an arbitrary slice.
  const visibleApmcs = showAll ? apmcs : apmcs.slice(0, VISIBLE_COUNT);

  return (
    <div className="mp-page">
      <BackLink label={t('backToHome')} onClick={() => navigate('/')} />
      <div className="mp-header">
        <h1 className="mp-title">{t('title')}</h1>
        <p className="mp-subtitle">{t('subtitle')}</p>
      </div>

      <div className="mp-apmc-list">
        {visibleApmcs.map((apmc) => (
          <button
            key={apmc.id}
            className={`mp-apmc-card${apmc.isNearest ? ' mp-apmc-nearest' : ''}`}
            onClick={() => navigate(`/market-prices/${apmc.id}`)}
          >
            <div className="mp-apmc-left">
              <span className="mp-pin">📍</span>
              <div>
                <b>{apmc.name}</b>
                <span className="mp-dist">{apmc.distanceKm?.toFixed(1)} km away</span>
              </div>
            </div>
            <div className="mp-apmc-right">
              {apmc.isNearest && <span className="mp-nearest-pill">{t('nearest')}</span>}
              <span className="mp-chev">›</span>
            </div>
          </button>
        ))}
      </div>

      {!showAll && apmcs.length > VISIBLE_COUNT && (
        <button className="mp-show-more-btn" onClick={() => setShowAll(true)}>
          {t('showMore')}
        </button>
      )}

      <div className="mp-note">ℹ️ {t('sourceNote')}</div>
    </div>
  );
}
