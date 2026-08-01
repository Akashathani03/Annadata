import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListings } from '../../../services/listingsService';
import { getCropCatalog } from '../../../services/marketPricesService';
import { useAuth } from '../../../context/AuthContext';
import SegmentedTabs from '../../../components/common/SegmentedTabs';
import ListingCard from '../../../components/common/ListingCard';
import './MyListings.css';

export default function MyListings() {
  const navigate = useNavigate();
  const { t } = useTranslation(['listings']);
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getListings({ category: 'crop', ownerId: user.id }),
      getCropCatalog(),
    ]).then(([listingResult, catalogResult]) => {
      if (cancelled) return;
      setListings(listingResult);
      setCatalog(catalogResult);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const active = listings.filter((l) => l.status === 'published' || l.status === 'draft');
  const sold = listings.filter((l) => l.status === 'sold');
  const visible = tab === 'sold' ? sold : active;

  function iconFor(listing) {
    return catalog.find((c) => c.id === listing.itemId)?.icon ?? '🌾';
  }

  return (
    <div className="my-listings-page">
      <SegmentedTabs
        tabs={[
          { key: 'active', label: `${t('listings:myListings.active')} (${active.length})` },
          { key: 'sold', label: `${t('listings:myListings.sold')} (${sold.length})` },
        ]}
        activeKey={tab}
        onChange={setTab}
      />

      {visible.length === 0 ? (
        <div className="my-listings-empty">
          <span className="icon">🌱</span>
          <b>{tab === 'sold' ? t('listings:myListings.emptySoldTitle') : t('listings:myListings.emptyActiveTitle')}</b>
          <span>{tab === 'sold' ? t('listings:myListings.emptySoldBody') : t('listings:myListings.emptyActiveBody')}</span>
          {tab === 'active' && (
            <button className="sticky-bar-primary" onClick={() => navigate('/sell/create')}>
              {t('listings:myListings.createListing')}
            </button>
          )}
        </div>
      ) : (
        <div className="my-listings-list">
          {visible.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              icon={iconFor(listing)}
              statusLabel={listing.status === 'published' ? t('listings:myListings.active') : listing.status}
              detailsLabel={t('listings:myListings.details')}
              editLabel={t('listings:myListings.edit')}
              onOpenDetail={() => navigate(`/sell/listings/${listing.id}`)}
              onEdit={() => navigate(`/sell/create?edit=${listing.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
