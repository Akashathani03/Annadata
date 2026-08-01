import './ListingCard.css';

function timeAgo(ts) {
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function ListingCard({ listing, icon, statusLabel, detailsLabel, editLabel, onOpenDetail, onEdit }) {
  const statusClass = listing.status === 'draft' ? 'draft' : listing.status === 'sold' ? 'sold' : '';

  return (
    <div className="listing-card">
      <div className="listing-card-top" onClick={onOpenDetail}>
        <div className="listing-card-thumb">
          {listing.photoUrl ? <img src={listing.photoUrl} alt="" /> : icon}
        </div>
        <div className="listing-card-info">
          <b>{listing.itemName}</b>
          <span>{listing.location}{listing.apmcName ? ` · ${listing.apmcName}` : ''}</span>
        </div>
        <span className={`listing-card-status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="listing-card-mini-grid">
        <div><span>Qty</span><b>{listing.quantity} {listing.unit}</b></div>
        <div><span>Price</span><b>₹{listing.price}</b></div>
        <div><span>Views</span><b>{listing.views || 0}</b></div>
      </div>

      <div className="listing-card-updated">Updated {timeAgo(listing.updatedAt || listing.createdAt)}</div>

      <div className="listing-card-actions">
        <button className="sticky-bar-secondary" onClick={onOpenDetail}>{detailsLabel}</button>
        <button className="sticky-bar-primary" onClick={onEdit}>{editLabel}</button>
      </div>
    </div>
  );
}
