import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCropPriceDetail } from '../../../services/marketPricesService';
import { formatDisplayDate } from '../../../utils/formatDate';
import AppShell from '../../../components/common/AppShell';
import { PriceGrid, PriceBox } from '../../../components/common/PriceBox';
import './MarketPrices.css';

export default function CropDetail() {
  const { apmcId, cropId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('marketPrices');

  const [detail, setDetail] = useState(undefined);
  // undefined = loading
  // null = not found / failed

  useEffect(() => {
    let cancelled = false;

    getCropPriceDetail(apmcId, cropId)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
      })
      .catch(() => {
        if (cancelled) return;

        // Treat a failed request as unavailable data rather than
        // leaving the page stuck on the loading state.
        setDetail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [apmcId, cropId]);

  if (detail === undefined) {
    return (
      <AppShell
        title={t('title')}
        onBack={() => navigate(`/market-prices/${apmcId}`)}
      >
        <div className="mp-note">
          {t('loading')}
        </div>
      </AppShell>
    );
  }

  if (detail === null) {
    return (
      <AppShell
        title={t('title')}
        onBack={() => navigate(`/market-prices/${apmcId}`)}
      >
        <div className="mp-note">
          {t('notFound')}
        </div>
      </AppShell>
    );
  }

  const {
    crop,
    apmc,
    minPrice,
    modalPrice,
    maxPrice,
    recentHistory,
  } = detail;

  return (
    <AppShell
      title={crop.name}
      onBack={() => navigate(`/market-prices/${apmcId}`)}
    >
      <div className="mp-market-bar">
        <div className="mp-market-left">
          📍 <b>{apmc.name}</b>
        </div>
      </div>

      <div className="mp-crop-hero">
        <div className="mp-crop-icon">
          {crop.icon}
        </div>

        <h2 className="mp-crop-name">
          {crop.name}
        </h2>
      </div>

      <PriceGrid>
        <PriceBox
          label={t('minimumPrice')}
          value={minPrice}
          unitLabel={t('perKg')}
          tone="red"
        />

        <PriceBox
          label={t('modalPrice')}
          value={modalPrice}
          unitLabel={t('perKg')}
          tone="green"
          highlight
          tag={t('mostCommonPrice')}
        />

        <PriceBox
          label={t('maximumPrice')}
          value={maxPrice}
          unitLabel={t('perKg')}
          tone="orange"
        />
      </PriceGrid>

      <div className="mp-recent-head">
        📊 {t('recentPrices')}
      </div>

      <table className="mp-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>{t('table.min')}</th>
            <th>{t('table.modal')}</th>
            <th>{t('table.max')}</th>
          </tr>
        </thead>

        <tbody>
          {recentHistory.map((row) => (
            <tr key={row.date}>
              <td>{formatDisplayDate(row.date)}</td>
              <td className="mp-red">
                {row.minPrice}
              </td>
              <td className="mp-green">
                {row.modalPrice}
              </td>
              <td className="mp-orange">
                {row.maxPrice}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mp-detail-actions">
        <button
          type="button"
          className="mp-secondary-btn"
          disabled
        >
          {t('compareNearby')}
        </button>

        <button
          type="button"
          className="mp-primary-btn"
          onClick={() => navigate('/sell')}
        >
          🛒 {t('sellThisCrop')}
        </button>
      </div>
    </AppShell>
  );
}