import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApmcMarkets } from '../../../services/marketPricesService';
import { useUserLocation } from '../../../context/LocationContext';
import BackLink from '../../../components/common/BackLink';
import './MarketPrices.css';

export default function ApmcList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('marketPrices');
  const { lat, lng } = useUserLocation();

  const [apmcs, setApmcs] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const VISIBLE_COUNT = 5;
  const skipAutoRedirect = location.state?.showAllMarkets === true;

  useEffect(() => {
    let cancelled = false;

    getApmcMarkets({ lat, lng })
      .then((result) => {
        if (cancelled) return;

        setApmcs(result);

        // Only when GPS is genuinely available - without real
        // coordinates the backend has no meaningful "nearest" to offer.
        if (
          !skipAutoRedirect &&
          lat != null &&
          lng != null &&
          result[0]?.isNearest
        ) {
          navigate(`/market-prices/${result[0].id}`, {
            replace: true,
          });
        }
      })
      .catch(() => {
        if (cancelled) return;

        // Keep the page usable if the APMC service/network fails.
        // An empty list is preferable to an unhandled Promise rejection.
        setApmcs([]);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, skipAutoRedirect, navigate]);

  // getApmcMarkets already returns markets sorted nearest-first
  // (per the backend service), so the first 5 are genuinely the
  // closest, not an arbitrary slice.
  const visibleApmcs = showAll
    ? apmcs
    : apmcs.slice(0, VISIBLE_COUNT);

  return (
    <div className="mp-page">
      <BackLink
        label={t('backToHome')}
        onClick={() => navigate('/')}
      />

      <div className="mp-header">
        <h1 className="mp-title">{t('title')}</h1>
        <p className="mp-subtitle">{t('subtitle')}</p>
      </div>

      <div className="mp-apmc-list">
        {visibleApmcs.map((apmc) => (
          <button
            key={apmc.id}
            className={`mp-apmc-card${
              apmc.isNearest ? ' mp-apmc-nearest' : ''
            }`}
            onClick={() =>
              navigate(`/market-prices/${apmc.id}`)
            }
          >
            <div className="mp-apmc-left">
              <span className="mp-pin">📍</span>

              <div>
                <b>{apmc.name}</b>

                <span className="mp-dist">
                  {apmc.distanceKm?.toFixed(1)} km away
                </span>
              </div>
            </div>

            <div className="mp-apmc-right">
              {apmc.isNearest && (
                <span className="mp-nearest-pill">
                  {t('nearest')}
                </span>
              )}

              <span className="mp-chev">›</span>
            </div>
          </button>
        ))}
      </div>

      {!showAll && apmcs.length > VISIBLE_COUNT && (
        <button
          className="mp-show-more-btn"
          onClick={() => setShowAll(true)}
        >
          {t('showMore')}
        </button>
      )}

      <div className="mp-note">
        ℹ️ {t('sourceNote')}
      </div>
    </div>
  );
}