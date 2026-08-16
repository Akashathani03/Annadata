import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApmcMarkets } from '../../../services/marketPricesService';
import { useUserLocation } from '../../../context/LocationContext';
import { formatDistanceKm } from '../../../utils/geo';
import AppShell from '../../../components/common/AppShell';
import './MarketPrices.css';

export default function ApmcList() {
  const navigate = useNavigate();
  const { t } = useTranslation('marketPrices');
  const { profileLat: lat, profileLng: lng } = useUserLocation();

  const [apmcs, setApmcs] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const VISIBLE_COUNT = 5;

  useEffect(() => {
    let cancelled = false;

    // Always lands here first and shows the nearest 5 (rest under
    // "Show more markets") - no longer auto-redirects straight into
    // the single nearest market's price list, so a farmer always sees
    // and can pick from real nearby options instead of only ever
    // reaching whichever one happened to sort first.
    getApmcMarkets({ lat, lng })
      .then((result) => {
        if (cancelled) return;
        setApmcs(result);
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
  }, [lat, lng]);

  // getApmcMarkets already returns markets sorted nearest-first
  // (per the backend service), so the first 5 are genuinely the
  // closest, not an arbitrary slice.
  const visibleApmcs = showAll
    ? apmcs
    : apmcs.slice(0, VISIBLE_COUNT);

  return (
    <AppShell
      title={t('title')}
      subtitle={t('subtitle')}
      onBack={() => navigate('/')}
    >
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
                  {formatDistanceKm(apmc.distanceKm)} km away
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
    </AppShell>
  );
}