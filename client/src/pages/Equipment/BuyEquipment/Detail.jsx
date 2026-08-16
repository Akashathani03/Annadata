import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getEquipmentListingDetail } from '../../../services/buyEquipmentService';
import { formatRelativeTime } from '../../../utils/formatDate';
import { formatDistanceKm } from '../../../utils/geo';
import { getBuyerLocation } from '../../../services/buyerLocationService';

import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';

import AppShell from '../../../components/common/AppShell';
import SellerInfoCard from '../../../components/common/SellerInfoCard';
import ContactButtons from '../../../components/common/ContactButtons';
import ShareListing from '../../../components/common/ShareListing';
import PhotoGallery from '../../../components/common/PhotoGallery';

import '../../Crops/BuyCrops/BuyCrops.css';


export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { t } = useTranslation([
    'buyCrops',
    'equipment',
    'common',
  ]);

  const { user } = useAuth();
  const { liveLocation, geocodedLocation } = useUserLocation();

  const [listing, setListing] = useState(undefined);


  /* ---------------- LOAD LISTING ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      try {
        const location = await getBuyerLocation({
          authenticatedUser: user,
          liveLocation,
          geocodedLocation,
        });

        const result = await getEquipmentListingDetail(id, {
          buyerLat: location?.lat,
          buyerLng: location?.lng,
        });

        if (!cancelled) {
          setListing(result);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            '[Equipment Detail] Failed to load listing:',
            error
          );
        }

        if (!cancelled) {
          setListing(null);
        }
      }
    }

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [id, user, liveLocation, geocodedLocation]);


  /* ---------------- LOADING ---------------- */

  if (listing === undefined) {
    return (
      <AppShell
        title={t('equipment:buyBrowse.detailTitle')}
        onBack={() => navigate('/buy-equipment')}
      >
        <p
          style={{
            padding: 16,
            color: 'var(--muted)',
          }}
        >
          {t('common:loading')}
        </p>
      </AppShell>
    );
  }


  /* ---------------- NOT AVAILABLE ---------------- */

  if (listing === null) {
    return (
      <AppShell
        title={t('equipment:buyBrowse.detailTitle')}
        onBack={() => navigate('/buy-equipment')}
      >
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          <div
            style={{
              fontSize: 42,
              marginBottom: 10,
            }}
          >
            🚜
          </div>

          <b>
            {t('detail.notAvailable', {
              defaultValue: 'Equipment listing is not available.',
            })}
          </b>
        </div>
      </AppShell>
    );
  }


  /* ---------------- DATA ---------------- */

  const phone = listing.phone || '';

  const whatsappMessage =
    `Hello, I found your ${listing.itemName || 'equipment'} ` +
    `listing on Annadata. Is it still available?`;

  const sellerLocation =
    [
      listing.locationVillage,
      listing.locationTaluk,
      listing.locationDistrict,
    ]
      .filter(Boolean)
      .join(', ') ||
    listing.location ||
    '—';

  const conditionLabel = listing.condition
    ? t(
        `equipment:condition.${listing.condition}`,
        {
          defaultValue: listing.condition,
        }
      )
    : '—';


  /* ---------------- UI ---------------- */

  return (
    <AppShell
      title={t('equipment:buyBrowse.detailTitle')}
      onBack={() => navigate('/buy-equipment')}

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

      {/* Hero Image */}
      <PhotoGallery
        photoUrls={listing.photoUrls}
        className="bc-detail-hero"
        fallback={<span>{listing.equipmentIcon || '🚜'}</span>}
      />


      {/* Title */}
      <h2
        style={{
          margin: '0 0 3px',
          fontSize: 19,
        }}
      >
        {listing.itemName || 'Equipment'}
      </h2>


      {/* Equipment Type */}
      <p
        style={{
          margin: '0 0 3px',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        {listing.equipmentIcon || '🚜'}{' '}
        {listing.equipmentTypeName || 'Equipment'}

        {listing.equipmentKannadaName
          ? ` / ${listing.equipmentKannadaName}`
          : ''}
      </p>


      {/* Seller */}
      <p
        style={{
          margin: '0 0 3px',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        👨‍🌾 {listing.sellerName || 'Seller'}
      </p>


      {/* Price */}
      <p
        style={{
          margin: '0 0 14px',
          color: 'var(--green-dark)',
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        ₹
        {Number(
          listing.price || 0
        ).toLocaleString('en-IN')}
      </p>


      {/* Share */}
      {listing.status === 'published' && (
        <ShareListing
          url={`${window.location.origin}/buy-equipment/${listing.id}`}
          title={listing.itemName || 'Equipment'}
        />
      )}


      {/* Details Card */}
      <div className="bc-detail-card">

        {/* Equipment Type */}
        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t('equipment:detail.equipmentType')}
          </span>

          <span>
            {listing.equipmentTypeName || '—'}
          </span>
        </div>


        {/* Condition */}
        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t('equipment:detail.condition')}
          </span>

          <span>
            {conditionLabel}
          </span>
        </div>


        {/* Description */}
        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t('detail.description')}
          </span>

          <span>
            {listing.description || '—'}
          </span>
        </div>


        {/* Location */}
        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t('detail.location')}
          </span>

          <span>
            {listing.location || '—'}
          </span>
        </div>


        {/* Distance */}
        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t('detail.distance')}
          </span>

          <span>
            {listing.distanceKm != null
              ? `${formatDistanceKm(listing.distanceKm)} km away`
              : '—'}
          </span>
        </div>


        {/* Posted Date */}
        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t('detail.postedOn')}
          </span>

          <span>
            {listing.createdAt
              ? formatRelativeTime(
                  listing.createdAt
                )
              : '—'}
          </span>
        </div>

      </div>


      {/* Seller Information */}
      <SellerInfoCard
        name={listing.sellerName || 'Seller'}
        location={sellerLocation}
        phone={phone}
      />


      {/* Bottom spacing for sticky contact bar */}
      <div style={{ height: 80 }} />

    </AppShell>
  );
}