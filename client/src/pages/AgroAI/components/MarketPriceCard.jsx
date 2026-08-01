import { useTranslation } from 'react-i18next';
import { IconTrendingUp, IconTrendingDown, IconTrendStable } from '../../../components/icons';
import './MarketPriceCard.css';

// Purely presentational (per Step 9 scope). Trend label resolution
// moved inside the component body (Step 15) since it now needs t(),
// which isn't available at module scope - the icon/className mapping
// stays a plain lookup object, only the label text is resolved here.
const TREND_ICONS = {
  up: { icon: IconTrendingUp, className: 'is-up' },
  down: { icon: IconTrendingDown, className: 'is-down' },
  stable: { icon: IconTrendStable, className: 'is-stable' },
};

export default function MarketPriceCard({
  cropName,
  marketName,
  location,
  currentPrice,
  unit,
  minPrice,
  maxPrice,
  lastUpdated,
  trend,
  summary,
  onViewMore,
}) {
  const { t } = useTranslation(['agroAI']);

  const trendLabels = {
    up: t('agroAI:marketPriceCard.trendUp'),
    down: t('agroAI:marketPriceCard.trendDown'),
    stable: t('agroAI:marketPriceCard.trendStable'),
  };
  const trendIcon = TREND_ICONS[trend];
  const hasRange = minPrice != null || maxPrice != null;

  return (
    <article className="market-price-card">
      <div className="market-price-card-header">
        <div className="market-price-card-titles">
          <p className="market-price-card-crop">{cropName}</p>
          {marketName && (
            <p className="market-price-card-market">
              {marketName}{location ? ` · ${location}` : ''}
            </p>
          )}
        </div>
        {trendIcon && (
          <span className={`market-price-trend ${trendIcon.className}`}>
            <trendIcon.icon size={13} strokeWidth={2} aria-hidden="true" />
            {trendLabels[trend]}
          </span>
        )}
      </div>

      {currentPrice != null && (
        <p className="market-price-card-current">
          ₹{currentPrice}
          {unit && <span className="market-price-unit"> / {unit}</span>}
        </p>
      )}

      {hasRange && (
        <dl className="market-price-range">
          {minPrice != null && (
            <div className="market-price-range-field">
              <dt>{t('agroAI:marketPriceCard.min')}</dt>
              <dd>₹{minPrice}</dd>
            </div>
          )}
          {maxPrice != null && (
            <div className="market-price-range-field">
              <dt>{t('agroAI:marketPriceCard.max')}</dt>
              <dd>₹{maxPrice}</dd>
            </div>
          )}
        </dl>
      )}

      {summary && <p className="market-price-summary">{summary}</p>}

      {lastUpdated && (
        <p className="market-price-updated">{t('agroAI:marketPriceCard.updatedLabel')} {lastUpdated}</p>
      )}

      {onViewMore && (
        <button type="button" className="market-price-view-more" onClick={onViewMore}>
          {t('agroAI:marketPriceCard.viewMoreMarkets')}
        </button>
      )}
    </article>
  );
}
