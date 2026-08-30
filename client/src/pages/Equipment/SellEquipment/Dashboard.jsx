import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListings } from '../../../services/listingsService';
import { useAuth } from '../../../context/AuthContext';
import '../../Crops/SellCrop/Dashboard.css';

function greetingKey() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'equipment:dashboard.greetingMorning';
  }

  if (hour < 17) {
    return 'equipment:dashboard.greetingAfternoon';
  }

  return 'equipment:dashboard.greetingEvening';
}

export default function Dashboard() {
  const { t } = useTranslation(['equipment', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadListings() {
      try {
        const listingResult = await getListings({
          category: 'equipment',
          ownerId: user.id,
        });

        if (!cancelled) {
          setListings(Array.isArray(listingResult) ? listingResult : []);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[Equipment Dashboard] Failed to load listings:', error);
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

  if (!user) return null;

  const active = listings.filter(
    (listing) => listing.status === 'published'
  ).length;

  const sold = listings.filter(
    (listing) => listing.status === 'closed'
  ).length;

  return (
    <div className="dash-page">
      <h2 className="dash-greeting">
        {t(greetingKey(), {
          name: user.name || 'Farmer',
        })}{' '}
        👋
      </h2>

      <div className="dash-hero">
        <div className="dash-hero-label">
          {t('equipment:dashboard.myListingsCard')}
        </div>

        <div className="dash-hero-row">
          <div>
            <span>
              {t('equipment:dashboard.activeListings')}
            </span>

            <b>{active}</b>
          </div>

          <div
            className="dash-hero-sold"
            onClick={() => navigate('/sell-equipment/listings')}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                navigate('/sell-equipment/listings');
              }
            }}
          >
            <span>
              {t('equipment:dashboard.soldListings')}
            </span>

            <b>{sold}</b>
          </div>
        </div>
      </div>
    </div>
  );
}