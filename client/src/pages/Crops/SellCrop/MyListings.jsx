import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListings } from '../../../services/listingsService';
import { getCropCatalog } from '../../../services/marketPricesService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import AppShell from '../../../components/common/AppShell';
import SegmentedTabs from '../../../components/common/SegmentedTabs';
import ListingCard from '../../../components/common/ListingCard';
import './MyListings.css';

export default function MyListings() {
  const navigate = useNavigate();
  const { t } = useTranslation(['listings']);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [listings, setListings] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadListings() {
      /*
       * Listings and crop catalog are independent requests.
       * Loading them separately means a catalog failure does not
       * prevent the farmer's listings from being displayed.
       */
      try {
        const listingResult = await getListings({
          category: 'crop',
          ownerId: user.id,
        });

        if (cancelled) return;

        setListings(
          Array.isArray(listingResult)
            ? listingResult
            : []
        );
      } catch {
        if (cancelled) return;

        setListings([]);

        showToast(
          t('listings:myListings.loadFailed')
        );
      }

      try {
        const catalogResult = await getCropCatalog();

        if (cancelled) return;

        setCatalog(
          Array.isArray(catalogResult)
            ? catalogResult
            : []
        );
      } catch {
        if (cancelled) return;

        /*
         * Listings can still work without the catalog.
         * ListingCard will use the fallback crop icon.
         */
        setCatalog([]);
      }
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [user, showToast, t]);

  const active = listings.filter(
    (listing) =>
      listing.status === 'published' ||
      listing.status === 'draft'
  );

  const sold = listings.filter(
    (listing) => listing.status === 'closed'
  );

  const visible =
    tab === 'sold'
      ? sold
      : active;

  function iconFor(listing) {
    return (
      catalog.find(
        (crop) => crop.id === listing.itemId
      )?.icon ?? '🌾'
    );
  }

  return (
    <AppShell
      title={t('listings:nav.myListings')}
      onBack={() => navigate('/sell/dashboard')}
    >
      <div className="my-listings-page">
        <SegmentedTabs
          tabs={[
            {
              key: 'active',
              label: `${t(
                'listings:myListings.active'
              )} (${active.length})`,
            },
            {
              key: 'sold',
              label: `${t(
                'listings:myListings.sold'
              )} (${sold.length})`,
            },
          ]}
          activeKey={tab}
          onChange={setTab}
        />

        {visible.length === 0 ? (
          <div className="my-listings-empty">
            <span className="icon">🌱</span>

            <b>
              {tab === 'sold'
                ? t(
                    'listings:myListings.emptySoldTitle'
                  )
                : t(
                    'listings:myListings.emptyActiveTitle'
                  )}
            </b>

            <span>
              {tab === 'sold'
                ? t(
                    'listings:myListings.emptySoldBody'
                  )
                : t(
                    'listings:myListings.emptyActiveBody'
                  )}
            </span>

            {tab === 'active' && (
              <button
                type="button"
                className="sticky-bar-primary"
                onClick={() =>
                  navigate('/sell/create')
                }
              >
                {t(
                  'listings:myListings.createListing'
                )}
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
                statusLabel={
                  listing.status === 'published'
                    ? t(
                        'listings:myListings.active'
                      )
                    : listing.status
                }
                detailsLabel={t(
                  'listings:myListings.details'
                )}
                editLabel={t(
                  'listings:myListings.edit'
                )}
                onOpenDetail={() =>
                  navigate(
                    `/sell/listings/${listing.id}`
                  )
                }
                onEdit={() =>
                  navigate(
                    `/sell/create?edit=${listing.id}`
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