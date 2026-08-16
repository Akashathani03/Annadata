import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { formatDistanceKm } from '../../../utils/geo';
import './ListingResultCard.css';

// Maps each category to its existing, already-built Buy Detail route -
// never a new or duplicate detail screen.
const DETAIL_ROUTE_BY_CATEGORY = {
  crop: (id) => `/buy/${id}`,
  animal: (id) => `/buy-animal/${id}`,
  equipment: (id) => `/buy-equipment/${id}`,
};

const CATEGORY_ICON = { crop: '🌾', animal: '🐄', equipment: '🚜' };

export default function ListingResultCard({ listings = [] }) {
  const { t } = useTranslation(['agroAI']);
  const navigate = useNavigate();

  if (!listings.length) return null;

  return (
    <article className="listing-result-card">
      {listings.map((l) => {
        const icon = CATEGORY_ICON[l.category] ?? '🛒';
        const routeFor = DETAIL_ROUTE_BY_CATEGORY[l.category];
        return (
          <div className="listing-result-row" key={l.id}>
            <div className="listing-result-photo">
              {l.photoUrls?.[0] ? <img src={resolveImageUrl(l.photoUrls[0])} alt="" /> : <span>{icon}</span>}
            </div>
            <div className="listing-result-info">
              <p className="listing-result-title">{l.itemName}</p>
              <p className="listing-result-meta">
                {l.price != null && <span className="listing-result-price">₹{l.price}</span>}
                {l.condition && <span className="listing-result-condition">{t(`equipment:condition.${l.condition}`)}</span>}
              </p>
              <p className="listing-result-location">
                {l.distanceKm != null ? `${formatDistanceKm(l.distanceKm)} km away` : l.location || ''}
              </p>
            </div>
            {routeFor && (
              <button
                type="button"
                className="listing-result-view-btn"
                onClick={() => navigate(routeFor(l.id))}
              >
                {t('agroAI:listingResultCard.viewListing')}
              </button>
            )}
          </div>
        );
      })}
    </article>
  );
}
