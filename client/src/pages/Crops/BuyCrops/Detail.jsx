import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCropListingDetail } from '../../../services/buyCropsService';
import { getBuyerLocation } from '../../../services/buyerLocationService';
import { getCropPriceDetail } from '../../../services/marketPricesService';
import { useAuth } from '../../../context/AuthContext';
import AppShell from '../../../components/common/AppShell';
import SellerInfoCard from '../../../components/common/SellerInfoCard';
import ContactButtons from '../../../components/common/ContactButtons';
import './BuyCrops.css';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['buyCrops', 'common']);
  const { user } = useAuth();
  const [listing, setListing] = useState(undefined);
  const [marketRef, setMarketRef] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getBuyerLocation({ authenticatedUser: user }).then((loc) =>
      getCropListingDetail(id, { buyerLat: loc.lat, buyerLng: loc.lng }).then((result) => {
        if (cancelled) return;
        setListing(result);
        if (result?.apmcId && result?.itemId) {
          getCropPriceDetail(result.apmcId, result.itemId).then((detail) => {
            if (!cancelled) setMarketRef(detail);
          });
        }
      })
    );
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (listing === undefined) {
    return (
      <AppShell title={t('detailTitle')} onBack={() => navigate('/buy')}>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('common:loading')}</p>
      </AppShell>
    );
  }

  if (listing === null) {
    return (
      <AppShell title={t('detailTitle')} onBack={() => navigate('/buy')}>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('detail.notAvailable')}</p>
      </AppShell>
    );
  }

  const phone = listing.phone || '9876543210';
  const whatsappMessage = t('detail.whatsappMessage', { crop: listing.itemName });
  const sellerLocation = [listing.locationVillage, listing.locationTaluk, listing.locationDistrict]
    .filter(Boolean)
    .join(', ') || listing.location;

  return (
    <AppShell
      title={t('detailTitle')}
      onBack={() => navigate('/buy')}
      stickyBar={
        <ContactButtons
          phone={phone}
          message={whatsappMessage}
          callLabel={t('detail.callFarmer')}
          whatsappLabel={t('detail.whatsapp')}
          size="large"
        />
      }
    >
      <div className="bc-detail-hero">
        {listing.photoUrl ? <img src={listing.photoUrl} alt="" /> : <span>{listing.cropIcon}</span>}
      </div>
      <h2 style={{ margin: '0 0 3px', fontSize: 19 }}>{listing.itemName} / {listing.cropKannadaName}</h2>
      <p style={{ margin: '0 0 3px', color: 'var(--muted)', fontSize: 13 }}>👨‍🌾 {listing.farmerName}</p>
      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800 }}>
        {t('detail.available', { qty: listing.quantity, unit: listing.unit })}
      </p>
      <p style={{ margin: '0 0 14px', color: 'var(--green-dark)', fontSize: 17, fontWeight: 900 }}>
        ₹{listing.price} / {listing.unit}
      </p>

      <div className="bc-market-ref">
        <div className="col"><span>{t('detail.marketRefMin')}</span><b>{marketRef ? `₹${marketRef.minPrice}` : '—'}</b></div>
        <div className="col"><span>{t('detail.marketRefModal')}</span><b>{marketRef ? `₹${marketRef.modalPrice}` : '—'}</b></div>
        <div className="col"><span>{t('detail.marketRefMax')}</span><b>{marketRef ? `₹${marketRef.maxPrice}` : '—'}</b></div>
        <div className="col" style={{ borderLeft: '1px solid #d5ead9' }}>
          <span>{t('detail.farmerPrice')}</span><b style={{ color: 'var(--green-dark)' }}>₹{listing.price}</b>
        </div>
      </div>
      <div className="bc-market-note">{t('detail.marketRefNote')}</div>

      <div className="bc-detail-card">
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.description')}</span><span>{listing.description || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.village')}</span><span>{listing.locationVillage || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.taluk')}</span><span>{listing.locationTaluk || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.district')}</span><span>{listing.locationDistrict || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.apmcMarket')}</span><span>{listing.apmcName || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}>
          <span>{t('detail.distance')}</span>
          <span>{listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km away` : '—'}</span>
        </div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.postedOn')}</span><span>{new Date(listing.createdAt).toLocaleString('en-IN')}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.lastUpdated')}</span><span>{new Date(listing.updatedAt).toLocaleString('en-IN')}</span></div>
      </div>

      <SellerInfoCard
        name={listing.farmerName}
        location={sellerLocation}
        phone={phone}
      />

      <div style={{ height: 80 }} />
    </AppShell>
  );
}
