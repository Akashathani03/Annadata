import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEnquiries, markEnquiryStatus } from '../../../services/enquiriesService';
import { getListingById } from '../../../services/listingsService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import SegmentedTabs from '../../../components/common/SegmentedTabs';
import '../../Crops/SellCrop/Enquiries.css';

function timeAgo(ts) {
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// Filters by category:'animal' server-side (cross-referencing each
// enquiry's listing), so a farmer who also sells crops never sees
// crop enquiries mixed in here, and vice versa in Sell Crop.
export default function Enquiries() {
  const { t } = useTranslation(['animals']);
  const { showToast } = useToast();
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [listingNames, setListingNames] = useState({});
  const [tab, setTab] = useState('all');

  async function reload() {
    if (!user) return;
    const result = await getEnquiries({ ownerId: user.id, category: 'animal' });
    setEnquiries(result);
    const uniqueListingIds = [...new Set(result.map((e) => e.listingId))];
    const listings = await Promise.all(uniqueListingIds.map((id) => getListingById(id)));
    const names = {};
    listings.forEach((l) => { if (l) names[l.id] = l.itemName; });
    setListingNames(names);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleDone(id) {
    await markEnquiryStatus(id, 'completed');
    showToast(t('animals:enquiriesScreen.markedCompleted'));
    reload();
  }

  const completed = enquiries.filter((e) => e.status === 'completed');
  const visible = tab === 'completed' ? completed : enquiries;

  return (
    <div className="enq-page">
      <div className="enq-card">
        <div className="enq-card-head">
          <h3>{t('animals:enquiriesScreen.title')}</h3>
          <p>{t('animals:enquiriesScreen.subtitle')}</p>
        </div>

        <SegmentedTabs
          tabs={[
            { key: 'all', label: `${t('animals:enquiriesScreen.all')} (${enquiries.length})` },
            { key: 'completed', label: `${t('animals:enquiriesScreen.completed')} (${completed.length})` },
          ]}
          activeKey={tab}
          onChange={setTab}
        />

        {visible.length === 0 ? (
          <div className="enq-empty">
            <span className="icon">💬</span>
            <b>{t('animals:enquiriesScreen.emptyTitle')}</b>
            <span>{t('animals:enquiriesScreen.emptyBody')}</span>
          </div>
        ) : (
          <div className="enq-list">
            {visible.map((e) => (
              <div className="listing-card" key={e.id}>
                <div className="listing-card-top">
                  <div className="listing-card-thumb enq-avatar">{(e.enquirer || '?')[0]}</div>
                  <div className="listing-card-info">
                    <b>{e.enquirer}</b>
                    <span>{listingNames[e.listingId] || ''} · {timeAgo(e.createdAt)}</span>
                  </div>
                  <span className={`listing-card-status ${e.status === 'completed' ? 'sold' : ''}`}>
                    {e.status === 'completed' ? t('animals:enquiriesScreen.completed') : t('animals:enquiriesScreen.open')}
                  </span>
                </div>
                <p className="enq-phone">📞 {e.phone || 'Not shared'}</p>
                <p className="enq-message">{e.message}</p>
                <div className="enq-actions">
                  <a className="sticky-bar-secondary" href={`tel:${e.phone || '9876543210'}`}>
                    📞 {t('animals:enquiriesScreen.call')}
                  </a>
                  <a
                    className="sticky-bar-secondary"
                    href={`https://wa.me/91${e.phone || '9876543210'}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    💬 {t('animals:enquiriesScreen.whatsapp')}
                  </a>
                  {e.status !== 'completed' && (
                    <button className="sticky-bar-primary" onClick={() => handleDone(e.id)}>
                      ✅ {t('animals:enquiriesScreen.done')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
