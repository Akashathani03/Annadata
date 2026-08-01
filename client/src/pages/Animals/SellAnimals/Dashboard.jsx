import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListings } from '../../../services/listingsService';
import { getEnquiries } from '../../../services/enquiriesService';
import { useAuth } from '../../../context/AuthContext';
import '../../Crops/SellCrop/Dashboard.css';

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'animals:dashboard.greetingMorning';
  if (hour < 17) return 'animals:dashboard.greetingAfternoon';
  return 'animals:dashboard.greetingEvening';
}

export default function Dashboard() {
  const { t } = useTranslation(['animals', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getListings({ category: 'animal', ownerId: user.id }),
      getEnquiries({ ownerId: user.id, category: 'animal' }),
    ]).then(([listingResult, enquiryResult]) => {
      if (cancelled) return;
      setListings(listingResult);
      setEnquiries(enquiryResult);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const active = listings.filter((l) => l.status === 'published').length;
  const sold = listings.filter((l) => l.status === 'sold').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
  const recentEnquiries = enquiries.slice(0, 3);

  return (
    <div className="dash-page">
      <h2 className="dash-greeting">{t(greetingKey(), { name: user.name || 'Farmer' })} 👋</h2>
      <div className="dash-locbar">
        📍 <span>{user.location || '—'}</span>
        <a onClick={() => navigate('/profile')}>{t('animals:dashboard.changeLocation')}</a>
      </div>

      <div className="dash-hero">
        <div className="dash-hero-label">🐄 {t('animals:dashboard.myListingsCard')}</div>
        <div className="dash-hero-row">
          <div><span>{t('animals:dashboard.activeListings')}</span><b>{active}</b></div>
          <div className="dash-hero-sold">
            <span>{t('animals:dashboard.soldListings')}</span><b>{sold}</b>
          </div>
        </div>
      </div>

      <div className="dash-stat-row">
        <div className="dash-stat-card">
          <div className="dash-stat-label">{t('animals:dashboard.buyerInterest')}</div>
          <div className="dash-stat-row-inner">
            <div><span>{t('animals:dashboard.totalEnquiries')}</span><b>{enquiries.length}</b></div>
            <span className="dash-stat-icon">💬</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">&nbsp;</div>
          <div className="dash-stat-row-inner">
            <div><span>{t('animals:dashboard.listingViews')}</span><b>{totalViews}</b></div>
            <span className="dash-stat-icon">👁</span>
          </div>
        </div>
      </div>

      <div className="dash-section-head">
        <h4>{t('animals:dashboard.recentEnquiries')}</h4>
        <a onClick={() => navigate('/sell-animal/enquiries')}>{t('common:viewAll')}</a>
      </div>

      {recentEnquiries.length === 0 ? (
        <div className="dash-empty">
          <span className="icon">💬</span>
          <b>{t('animals:dashboard.noEnquiriesTitle')}</b>
          <span>{t('animals:dashboard.noEnquiriesBody')}</span>
        </div>
      ) : (
        <div className="dash-enquiry-list">
          {recentEnquiries.map((e) => (
            <div className="dash-enquiry-mini" key={e.id}>
              <div className="av">{(e.enquirer || '?')[0]}</div>
              <div className="info"><b>{e.enquirer}</b><span>{e.message}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
