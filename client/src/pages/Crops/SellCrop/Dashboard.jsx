import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListings } from '../../../services/listingsService';
import { useAuth } from '../../../context/AuthContext';
import './Dashboard.css';

function greetingKey() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'listings:dashboard.greetingMorning';
  }

  if (hour < 17) {
    return 'listings:dashboard.greetingAfternoon';
  }

  return 'listings:dashboard.greetingEvening';
}

export default function Dashboard() {
  const { t } = useTranslation(['listings', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    async function loadListings() {
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

        // Keep the dashboard usable if the listings
        // service/network request fails.
        setListings([]);
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
          {t('listings:dashboard.myListingsCard')}
        </div>

        <div className="dash-hero-row">
          <div>
            <span>
              {t('listings:dashboard.activeListings')}
            </span>
            <b>{active}</b>
          </div>

          <div
            className="dash-hero-sold"
            onClick={() => navigate('/sell/sales')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/sell/sales');
              }
            }}
          >
            <span>
              {t('listings:dashboard.soldListings')}
            </span>
            <b>{sold}</b>
          </div>
        </div>
      </div>
    </div>
  );
}