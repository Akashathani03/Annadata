import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAnimalListingDetail } from '../../../services/buyAnimalsService';
import { getBuyerLocation } from '../../../services/buyerLocationService';
import { useAuth } from '../../../context/AuthContext';
import AppShell from '../../../components/common/AppShell';
import SellerInfoCard from '../../../components/common/SellerInfoCard';
import ContactButtons from '../../../components/common/ContactButtons';
import '../../Crops/BuyCrops/BuyCrops.css';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['buyCrops', 'animals', 'common']);
  const { user } = useAuth();
  const [listing, setListing] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    getBuyerLocation({ authenticatedUser: user }).then((loc) =>
      getAnimalListingDetail(id, { buyerLat: loc.lat, buyerLng: loc.lng }).then((result) => {
        if (!cancelled) setListing(result);
      })
    );
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (listing === undefined) {
    return (
      <AppShell title={t('animals:buyBrowse.detailTitle')} onBack={() => navigate('/buy-animal')}>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('common:loading')}</p>
      </AppShell>
    );
  }

  if (listing === null) {
    return (
      <AppShell title={t('animals:buyBrowse.detailTitle')} onBack={() => navigate('/buy-animal')}>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('detail.notAvailable')}</p>
      </AppShell>
    );
  }

  const phone = listing.phone || '9876543210';
  const whatsappMessage = `Hello, I found your ${listing.itemName} listing on Annadata. Is it still available?`;
  const sellerLocation = [listing.locationVillage, listing.locationTaluk, listing.locationDistrict]
    .filter(Boolean)
    .join(', ') || listing.location;

  return (
    <AppShell
      title={t('animals:buyBrowse.detailTitle')}
      onBack={() => navigate('/buy-animal')}
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
        {listing.photoUrl ? <img src={listing.photoUrl} alt="" /> : <span>{listing.animalIcon}</span>}
      </div>
      <h2 style={{ margin: '0 0 3px', fontSize: 19 }}>{listing.itemName}</h2>
      <p style={{ margin: '0 0 3px', color: 'var(--muted)', fontSize: 13 }}>{listing.animalIcon} {listing.animalTypeName} / {listing.animalKannadaName}</p>
      <p style={{ margin: '0 0 3px', color: 'var(--muted)', fontSize: 13 }}>👨‍🌾 {listing.sellerName}</p>
      <p style={{ margin: '0 0 14px', color: 'var(--green-dark)', fontSize: 17, fontWeight: 900 }}>
        ₹{listing.price}
      </p>

      <div className="bc-detail-card">
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.description')}</span><span>{listing.description || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.village')}</span><span>{listing.locationVillage || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.taluk')}</span><span>{listing.locationTaluk || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.district')}</span><span>{listing.locationDistrict || '—'}</span></div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}>
          <span>{t('detail.distance')}</span>
          <span>{listing.distanceKm != null ? `${listing.distanceKm.toFixed(1)} km away` : '—'}</span>
        </div>
        <div className="bc-detail-row" style={{ padding: '14px 16px' }}><span>{t('detail.postedOn')}</span><span>{new Date(listing.createdAt).toLocaleString('en-IN')}</span></div>
      </div>

      <SellerInfoCard
        name={listing.sellerName}
        location={sellerLocation}
        phone={phone}
      />

      <div style={{ height: 80 }} />
    </AppShell>
  );
}
