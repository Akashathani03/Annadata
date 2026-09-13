import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import './ListingResultCard.css';

// Maps each category to its existing, already-built Buy Detail route -
// never a new or duplicate detail screen.
const DETAIL_ROUTE_BY_CATEGORY = {
  crop: (id) => `/buy/${id}`,
  animal: (id) => `/buy-animal/${id}`,
  equipment: (id) => `/buy-equipment/${id}`,
};

const CATEGORY_ICON = { crop: '🌾', animal: '🐄', equipment: '🚜' };

// Same categories/routes as DESTINATION_ROUTE_BY_CATEGORY above, but
// for the category-wide Buy Browse screen rather than one listing's
// own detail page - both already exist, no new routes involved.
const BROWSE_ROUTE_BY_CATEGORY = { crop: '/buy', animal: '/buy-animal', equipment: '/buy-equipment' };

export default function ListingResultCard({ listings = [] }) {
  const { t } = useTranslation(['agroAI']);
  const navigate = useNavigate();

  if (!listings.length) return null;

  // Every listing here came from one category-scoped search (see
  // executeMarketplaceSearch), so the first listing's category is
  // always the right one for "View All" - never mixed categories in
  // one card.
  const browseRoute = BROWSE_ROUTE_BY_CATEGORY[listings[0]?.category];

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
                {l.location || ''}
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
      {browseRoute && (
        <button
          type="button"
          className="listing-result-view-all-btn"
          onClick={() => navigate(browseRoute)}
        >
          {t('agroAI:listingResultCard.viewAll')}
        </button>
      )}
    </article>
  );
}
