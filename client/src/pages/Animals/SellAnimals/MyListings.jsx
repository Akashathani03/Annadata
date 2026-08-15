import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListings } from '../../../services/listingsService';
import { animalCatalog } from '../../../config/animalCatalog';
import { useAuth } from '../../../context/AuthContext';
import AppShell from '../../../components/common/AppShell';
import SegmentedTabs from '../../../components/common/SegmentedTabs';
import ListingCard from '../../../components/common/ListingCard';
import '../../Crops/SellCrop/MyListings.css';

export default function MyListings() {
  const navigate = useNavigate();
  const { t } = useTranslation(['animals']);
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getListings({
      category: 'animal',
      ownerId: user.id,
    })
      .then((result) => {
        if (cancelled) return;

        setListings(
          Array.isArray(result)
            ? result
            : []
        );
      })
      .catch(() => {
        if (cancelled) return;

        setListings([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const active = listings.filter(
    (listing) =>
      listing.status === 'published' ||
      listing.status === 'draft'
  );

  const sold = listings.filter(
    (listing) => listing.status === 'closed'
  );

  const visible = tab === 'sold' ? sold : active;

  function iconFor(listing) {
    return (
      animalCatalog.find(
        (animal) => animal.id === listing.itemId
      )?.icon ?? '🐄'
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell
      title={t('animals:nav.myListings')}
      onBack={() => navigate('/sell-animal/dashboard')}
    >
      <div className="my-listings-page">

        {/* Active / Sold Tabs */}
        <SegmentedTabs
          tabs={[
            {
              key: 'active',
              label: `${t(
                'animals:myListings.active'
              )} (${active.length})`,
            },
            {
              key: 'sold',
              label: `${t(
                'animals:myListings.sold'
              )} (${sold.length})`,
            },
          ]}
          activeKey={tab}
          onChange={setTab}
        />

        {/* Empty State */}
        {visible.length === 0 ? (
          <div className="my-listings-empty">
            <span className="icon">🐄</span>

            <b>
              {tab === 'sold'
                ? t(
                    'animals:myListings.emptySoldTitle'
                  )
                : t(
                    'animals:myListings.emptyActiveTitle'
                  )}
            </b>

            <span>
              {tab === 'sold'
                ? t(
                    'animals:myListings.emptySoldBody'
                  )
                : t(
                    'animals:myListings.emptyActiveBody'
                  )}
            </span>

            {tab === 'active' && (
              <button
                type="button"
                className="sticky-bar-primary"
                onClick={() =>
                  navigate('/sell-animal/create')
                }
              >
                {t(
                  'animals:myListings.createListing'
                )}
              </button>
            )}
          </div>
        ) : (

          /* Listings */
          <div className="my-listings-list">
            {visible.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                icon={iconFor(listing)}
                statusLabel={
                  listing.status === 'published'
                    ? t(
                        'animals:myListings.active'
                      )
                    : listing.status
                }
                detailsLabel={t(
                  'animals:myListings.details'
                )}
                editLabel={t(
                  'animals:myListings.edit'
                )}
                onOpenDetail={() =>
                  navigate(
                    `/sell-animal/listings/${listing.id}`
                  )
                }
                onEdit={() =>
                  navigate(
                    `/sell-animal/create?edit=${listing.id}`
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}