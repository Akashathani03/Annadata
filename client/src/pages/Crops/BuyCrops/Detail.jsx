import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getCropListingDetail } from '../../../services/buyCropsService';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { getBuyerLocation } from '../../../services/buyerLocationService';
import { getCropPriceDetail } from '../../../services/marketPricesService';
import { useAuth } from '../../../context/AuthContext';
import { formatRelativeTime } from '../../../utils/formatDate';

import AppShell from '../../../components/common/AppShell';
import SellerInfoCard from '../../../components/common/SellerInfoCard';
import ContactButtons from '../../../components/common/ContactButtons';
import ShareListing from '../../../components/common/ShareListing';

import './BuyCrops.css';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { t } = useTranslation([
    'buyCrops',
    'common',
  ]);

  const { user } = useAuth();

  // undefined = loading
  // null = not found
  const [listing, setListing] = useState(undefined);

  const [marketRef, setMarketRef] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      try {
        /*
         * Get the buyer's saved/current location first.
         *
         * If location isn't available, the listing can still
         * be loaded without distance information.
         */
        let buyerLocation = null;

        try {
          buyerLocation = await getBuyerLocation({
            authenticatedUser: user,
          });
        } catch {
          buyerLocation = null;
        }

        if (cancelled) return;

        const result = await getCropListingDetail(id, {
          buyerLat: buyerLocation?.lat ?? null,
          buyerLng: buyerLocation?.lng ?? null,
        });

        if (cancelled) return;

        setListing(result);

        /*
         * Market reference is optional.
         *
         * If it fails, the listing should still remain usable.
         */
        if (result?.apmcId && result?.itemId) {
          try {
            const detail = await getCropPriceDetail(
              result.apmcId,
              result.itemId
            );

            if (!cancelled) {
              setMarketRef(detail ?? null);
            }
          } catch {
            if (!cancelled) {
              setMarketRef(null);
            }
          }
        } else {
          setMarketRef(null);
        }
      } catch {
        if (cancelled) return;

        setListing(null);
        setMarketRef(null);
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  /*
   * Loading state
   */
  if (listing === undefined) {
    return (
      <AppShell
        title={t('detailTitle')}
        onBack={() => navigate('/buy')}
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
        title={t('detailTitle')}
        onBack={() => navigate('/buy')}
      >
        <div className="bc-empty">
          <span className="ic">🌾</span>

          <b>
            {t('detail.notAvailable')}
          </b>

          <button
            type="button"
            className="sticky-bar-primary"
            onClick={() => navigate('/buy')}
          >
            {t('common:back')}
          </button>
        </div>
      </AppShell>
    );
  }

  const phone = listing.phone || '';

  const whatsappMessage = t(
    'detail.whatsappMessage',
    {
      crop: listing.itemName,
    }
  );

  /*
   * Build a readable seller location.
   *
   * Prefer the structured location fields when
   * available, otherwise use the listing location.
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

  const distanceText =
    listing.distanceKm != null
      ? `${Number(listing.distanceKm).toFixed(1)} km away`
      : '—';

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
      {/* =========================
          CROP IMAGE
      ========================= */}

      <div className="bc-detail-hero">
        {listing.photoUrl ? (
          <img
            src={resolveImageUrl(
              listing.photoUrl
            )}
            alt=""
          />
        ) : (
          <span>
            {listing.cropIcon || '🌾'}
          </span>
        )}
      </div>

      {/* =========================
          CROP BASIC INFO
      ========================= */}

      <h2
        style={{
          margin: '0 0 3px',
          fontSize: 19,
        }}
      >
        {listing.itemName}

        {listing.cropKannadaName && (
          <>
            {' / '}
            {listing.cropKannadaName}
          </>
        )}
      </h2>

      <p
        style={{
          margin: '0 0 3px',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        👨‍🌾 {listing.farmerName || 'Farmer'}
      </p>

      <p
        style={{
          margin: '0 0 4px',
          fontSize: 15,
          fontWeight: 800,
        }}
      >
        {t('detail.available', {
          qty: listing.quantity,
          unit: listing.unit,
        })}
      </p>

      <p
        style={{
          margin: '0 0 14px',
          color: 'var(--green-dark)',
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        ₹{listing.price} / {listing.unit}
      </p>

      {/* =========================
          SHARE
      ========================= */}

      {listing.status === 'published' && (
        <ShareListing
          url={`${window.location.origin}/buy/${listing.id}`}
          title={listing.itemName}
        />
      )}

      {/* =========================
          MARKET PRICE REFERENCE
      ========================= */}

      <div className="bc-market-ref">
        <div className="col">
          <span>
            {t('detail.marketRefMin')}
          </span>

          <b>
            {marketRef
              ? `₹${marketRef.minPrice}`
              : '—'}
          </b>
        </div>

        <div className="col">
          <span>
            {t('detail.marketRefModal')}
          </span>

          <b>
            {marketRef
              ? `₹${marketRef.modalPrice}`
              : '—'}
          </b>
        </div>

        <div className="col">
          <span>
            {t('detail.marketRefMax')}
          </span>

          <b>
            {marketRef
              ? `₹${marketRef.maxPrice}`
              : '—'}
          </b>
        </div>

        <div
          className="col"
          style={{
            borderLeft:
              '1px solid #d5ead9',
          }}
        >
          <span>
            {t('detail.farmerPrice')}
          </span>

          <b
            style={{
              color: 'var(--green-dark)',
            }}
          >
            ₹{listing.price}
          </b>
        </div>
      </div>

      <div className="bc-market-note">
        {t('detail.marketRefNote')}
      </div>

      {/* =========================
          LISTING DETAILS
      ========================= */}

      <div className="bc-detail-card">
        <div
          className="bc-detail-row"
          style={{
            padding: '14px 16px',
          }}
        >
          <span>
            {t('detail.description')}
          </span>

          <span>
            {listing.description || '—'}
          </span>
        </div>

        <div
          className="bc-detail-row"
          style={{
            padding: '14px 16px',
          }}
        >
          <span>
            {t('detail.location')}
          </span>

          <span>
            {listing.location || '—'}
          </span>
        </div>

        <div
          className="bc-detail-row"
          style={{
            padding: '14px 16px',
          }}
        >
          <span>
            {t('detail.distance')}
          </span>

          <span>
            {distanceText}
          </span>
        </div>

        <div
          className="bc-detail-row"
          style={{
            padding: '14px 16px',
          }}
        >
          <span>
            {t('detail.lastUpdated')}
          </span>

          <span>
            {formatRelativeTime(
              listing.updatedAt
            )}
          </span>
        </div>
      </div>

      {/* =========================
          SELLER
      ========================= */}

      <SellerInfoCard
        name={listing.farmerName}
        location={sellerLocation}
        phone={phone}
      />

      {/* Space for sticky contact bar */}
      <div style={{ height: 80 }} />
    </AppShell>
  );
}