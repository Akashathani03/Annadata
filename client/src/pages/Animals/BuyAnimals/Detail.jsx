import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getAnimalListingDetail } from '../../../services/buyAnimalsService';
import { getBuyerLocation } from '../../../services/buyerLocationService';

import { formatRelativeTime } from '../../../utils/formatDate';

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
    'animals',
    'common',
  ]);

  const { user } = useAuth();
  const { liveLocation, geocodedLocation } = useUserLocation();

  const [listing, setListing] = useState(undefined);

  /*
   * Load animal listing.
   *
   * Buyer location is passed to the service so the backend can
   * calculate distance from the buyer to the seller.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      try {
        const loc = await getBuyerLocation({
          authenticatedUser: user,
          liveLocation,
          geocodedLocation,
        });

        const result = await getAnimalListingDetail(id, {
          buyerLat: loc?.lat,
          buyerLng: loc?.lng,
        });

        if (!cancelled) {
          setListing(result);
        }
      } catch {
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


  /*
   * Loading state
   */
  if (listing === undefined) {
    return (
      <AppShell
        title={t(
          'animals:buyBrowse.detailTitle'
        )}
        onBack={() => navigate('/buy-animal')}
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


  /*
   * Listing not found / unavailable
   */
  if (listing === null) {
    return (
      <AppShell
        title={t(
          'animals:buyBrowse.detailTitle'
        )}
        onBack={() => navigate('/buy-animal')}
      >
        <div
          className="bc-empty"
          style={{ marginTop: 16 }}
        >
          <span className="ic">🐄</span>

          <b>
            {t(
              'animals:buyBrowse.emptyTitle'
            )}
          </b>

          <p>
            {t(
              'animals:buyBrowse.emptyBody'
            )}
          </p>

          <button
            type="button"
            className="sticky-bar-primary"
            onClick={() =>
              navigate('/buy-animal')
            }
          >
            {t(
              'animals:buyBrowse.browseTitle'
            )}
          </button>
        </div>
      </AppShell>
    );
  }


  /*
   * Seller phone.
   *
   * Do not use a fake/default phone number.
   */
  const phone = listing.phone || '';


  /*
   * WhatsApp message.
   */
  const whatsappMessage = t('animals:detail.whatsappMessage', {
    item: listing.itemName,
  });


  /*
   * Build seller location from structured location
   * fields when available.
   */
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


  return (
    <AppShell
      title={t(
        'animals:buyBrowse.detailTitle'
      )}
      onBack={() => navigate('/buy-animal')}
      stickyBar={
        <ContactButtons
          phone={phone}
          message={whatsappMessage}
          callLabel={t(
            'buyCrops:detail.callFarmer',
            'Call Seller'
          )}
          whatsappLabel={t(
            'buyCrops:detail.whatsapp',
            'WhatsApp'
          )}
          size="large"
        />
      }
    >
      {/* Animal Image */}
      <PhotoGallery
        photoUrls={listing.photoUrls}
        className="bc-detail-hero"
        fallback={<span>{listing.animalIcon || '🐾'}</span>}
      />


      {/* Animal Title */}
      <h2
        style={{
          margin: '0 0 3px',
          fontSize: 19,
        }}
      >
        {listing.itemName}
      </h2>


      {/* Animal Type */}
      <p
        style={{
          margin: '0 0 3px',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        {listing.animalIcon || '🐾'}{' '}
        {listing.animalTypeName || '—'}

        {listing.animalKannadaName
          ? ` / ${listing.animalKannadaName}`
          : ''}
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


      {/* Animal Details */}
      <div
        className="bc-detail-card"
        style={{ marginBottom: 14 }}
      >

        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t(
              'animals:detail.location'
            )}
          </span>

          <span>
            {listing.location || '—'}
          </span>
        </div>


        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t(
              'animals:detail.postedOn'
            )}
          </span>

          <span>
            {listing.createdAt
              ? formatRelativeTime(
                  listing.createdAt
                )
              : '—'}
          </span>
        </div>


        <div
          className="bc-detail-row"
          style={{ padding: '14px 16px' }}
        >
          <span>
            {t(
              'animals:detail.description'
            )}
          </span>

          <span>
            {listing.description || '—'}
          </span>
        </div>

      </div>


      {/* Share */}
      {listing.status === 'published' && (
        <ShareListing
          url={`${window.location.origin}/buy-animal/${listing.id}`}
          title={listing.itemName}
        />
      )}


      {/* Seller Information */}
      <SellerInfoCard
        name={
          listing.sellerName ||
          'Farmer'
        }
        location={sellerLocation}
        phone={phone}
      />


      {/* Bottom spacing for sticky contact bar */}
      <div style={{ height: 80 }} />
    </AppShell>
  );
}