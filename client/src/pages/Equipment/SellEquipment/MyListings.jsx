import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getListings } from '../../../services/listingsService';
import { equipmentCatalog } from '../../../config/equipmentCatalog';
import { useAuth } from '../../../context/AuthContext';

import AppShell from '../../../components/common/AppShell';
import SegmentedTabs from '../../../components/common/SegmentedTabs';
import ListingCard from '../../../components/common/ListingCard';

import '../../Crops/SellCrop/MyListings.css';


export default function MyListings() {
  const navigate = useNavigate();
  const { t } = useTranslation(['equipment']);
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [tab, setTab] = useState('active');


  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadListings() {
      try {
        const result = await getListings({
          category: 'equipment',
          ownerId: user.id,
        });

        if (!cancelled) {
          setListings(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            '[Equipment MyListings] Failed to load listings:',
            error
          );
        }

        if (!cancelled) {
          setListings([]);
        }
      }
    }

    loadListings();

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
      equipmentCatalog.find(
        (equipment) => equipment.id === listing.itemId
      )?.icon ?? '🔧'
    );
  }


  return (
    <AppShell
      title={t('equipment:nav.myListings')}
      onBack={() => navigate('/sell-equipment/dashboard')}
    >
      <div className="my-listings-page">

        {/* Tabs */}
        <SegmentedTabs
          tabs={[
            {
              key: 'active',
              label: t('equipment:myListings.active'),
            },
            {
              key: 'sold',
              label: t('equipment:myListings.sold'),
            },
          ]}
          activeKey={tab}
          onChange={setTab}
        />


        {/* Empty State */}
        {visible.length === 0 ? (
          <div className="my-listings-empty">

            <span className="icon">
              🚜
            </span>

            <b>
              {tab === 'sold'
                ? t('equipment:myListings.emptySoldTitle')
                : t('equipment:myListings.emptyActiveTitle')}
            </b>

            <span>
              {tab === 'sold'
                ? t('equipment:myListings.emptySoldBody')
                : t('equipment:myListings.emptyActiveBody')}
            </span>

            {tab === 'active' && (
              <button
                type="button"
                className="sticky-bar-primary"
                onClick={() =>
                  navigate('/sell-equipment/create')
                }
              >
                {t('equipment:myListings.createListing')}
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
                    ? t('equipment:myListings.active')
                    : listing.status
                }

                detailsLabel={t(
                  'equipment:myListings.details'
                )}

                editLabel={t(
                  'equipment:myListings.edit'
                )}

                onOpenDetail={() =>
                  navigate(
                    `/sell-equipment/listings/${listing.id}`
                  )
                }

                onEdit={() =>
                  navigate(
                    `/sell-equipment/create?edit=${listing.id}`
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