import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListings } from '../../../services/listingsService';
import { useAuth } from '../../../context/AuthContext';
import '../../Crops/SellCrop/Dashboard.css';

function greetingKey() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'animals:dashboard.greetingMorning';
  }

  if (hour < 17) {
    return 'animals:dashboard.greetingAfternoon';
  }

  return 'animals:dashboard.greetingEvening';
}

export default function Dashboard() {
  const { t } = useTranslation(['animals', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getListings({
      category: 'animal',
      ownerId: user.id,
    })
      .then((listingResult) => {
        if (cancelled) return;

        setListings(
          Array.isArray(listingResult)
            ? listingResult
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

  if (!user) {
    return null;
  }

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
          {t('animals:dashboard.myListingsCard')}
        </div>

        <div className="dash-hero-row">
          <div>
            <span>
              {t('animals:dashboard.activeListings')}
            </span>

            <b>{active}</b>
          </div>

          <div
            className="dash-hero-sold"
            onClick={() =>
              navigate('/sell-animal/listings')
            }
          >
            <span>
              {t('animals:dashboard.soldListings')}
            </span>

            <b>{sold}</b>
          </div>
        </div>
      </div>
    </div>
  );
}