import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '../../utils/formatDate';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import './ListingCard.css';

export default function ListingCard({ listing, icon, statusLabel, detailsLabel, editLabel, onOpenDetail, onEdit }) {
  const { t } = useTranslation(['listings']);
  const statusClass = listing.status === 'draft' ? 'draft' : listing.status === 'closed' ? 'sold' : '';

  return (
    <div className="listing-card">
      <div className="listing-card-top" onClick={onOpenDetail}>
        <div className="listing-card-thumb">
          {listing.photoUrls?.[0] ? <img src={resolveImageUrl(listing.photoUrls[0])} alt="" /> : icon}
        </div>
        <div className="listing-card-info">
          <b>{listing.itemName}</b>
          <span>{listing.location}</span>
        </div>
        <span className={`listing-card-status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="listing-card-mini-grid">
        <div><span>{t('listings:myListings.qty')}</span><b>{listing.quantity} {listing.unit}</b></div>
        <div><span>{t('listings:myListings.price')}</span><b>₹{listing.price}</b></div>
      </div>

      <div className="listing-card-updated">{t('listings:myListings.updated')} {formatRelativeTime(listing.updatedAt || listing.createdAt)}</div>

      <div className="listing-card-actions">
        <button className="sticky-bar-secondary" onClick={onOpenDetail}>{detailsLabel}</button>
        <button className="sticky-bar-primary" onClick={onEdit}>{editLabel}</button>
      </div>
    </div>
  );
}
