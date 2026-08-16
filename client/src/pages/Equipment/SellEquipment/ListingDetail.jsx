import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  getListingById,
  updateListing,
  deleteListing,
  markListingSold,
} from '../../../services/listingsService';

import { equipmentCatalog } from '../../../config/equipmentCatalog';
import { useToast } from '../../../context/ToastContext';
import { formatRelativeTime } from '../../../utils/formatDate';

import AppShell from '../../../components/common/AppShell';
import ShareListing from '../../../components/common/ShareListing';
import BottomSheet from '../../../components/common/BottomSheet';
import PhotoGallery from '../../../components/common/PhotoGallery';

import '../../Crops/SellCrop/ListingDetail.css';


export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { t } = useTranslation(['equipment', 'common']);
  const { showToast } = useToast();

  const [listing, setListing] = useState(undefined);
  const [sheet, setSheet] = useState(null);

  const [priceInput, setPriceInput] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [soldBuyer, setSoldBuyer] = useState('');

  const [priceInputError, setPriceInputError] = useState('');
  const [soldPriceError, setSoldPriceError] = useState('');

  const icon =
    equipmentCatalog.find(
      (equipment) => equipment.id === listing?.itemId
    )?.icon ?? '🚜';


  async function reload() {
    try {
      const result = await getListingById(id);
      setListing(result);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[Equipment ListingDetail] Failed to load listing:',
          error
        );
      }

      setListing(null);
    }
  }


  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      try {
        const result = await getListingById(id);

        if (!cancelled) {
          setListing(result);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            '[Equipment ListingDetail] Failed to load listing:',
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
  }, [id]);


  async function handleSavePrice() {
    const value = Number(priceInput);

    if (!value || value <= 0) {
      setPriceInputError(
        t('equipment:create.validationPrice')
      );
      return;
    }

    try {
      setPriceInputError('');

      await updateListing(id, {
        price: value,
      });

      setSheet(null);

      showToast(
        t('equipment:detail.priceUpdated')
      );

      await reload();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[Equipment ListingDetail] Price update failed:',
          error
        );
      }

      showToast(
        t('equipment:detail.updateFailed', {
          defaultValue: 'Could not update listing. Please try again.',
        })
      );
    }
  }


  async function handleConfirmSold() {
    const price = Number(soldPrice);

    if (!price || price <= 0) {
      setSoldPriceError(
        t('equipment:create.validationPrice')
      );
      return;
    }

    try {
      setSoldPriceError('');

      await markListingSold(id, {
        quantitySold: 1,
        saleAmount: price,
        buyerName: soldBuyer.trim() || 'Buyer',
      });

      setSheet(null);

      showToast(
        t('equipment:detail.markedSold')
      );

      navigate('/sell-equipment/listings');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[Equipment ListingDetail] Mark sold failed:',
          error
        );
      }

      showToast(
        t('equipment:detail.updateFailed', {
          defaultValue: 'Could not update listing. Please try again.',
        })
      );
    }
  }


  async function handleDelete() {
    const confirmed = window.confirm(
      t('equipment:detail.deleteConfirm')
    );

    if (!confirmed) return;

    try {
      await deleteListing(id);

      showToast(
        t('equipment:detail.deleted')
      );

      navigate('/sell-equipment/listings');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[Equipment ListingDetail] Delete failed:',
          error
        );
      }

      showToast(
        t('equipment:detail.updateFailed', {
          defaultValue: 'Could not update listing. Please try again.',
        })
      );
    }
  }


  if (listing === undefined) {
    return (
      <AppShell
        title={t('equipment:nav.myListings')}
        onBack={() => navigate('/sell-equipment/listings')}
      >
        <div className="ld-page">
          <p
            style={{
              padding: 16,
              color: 'var(--muted)',
            }}
          >
            {t('common:loading')}
          </p>
        </div>
      </AppShell>
    );
  }


  if (listing === null) {
    return (
      <AppShell
        title={t('equipment:nav.myListings')}
        onBack={() => navigate('/sell-equipment/listings')}
      >
        <div className="ld-page">
          <p
            style={{
              padding: 16,
              color: 'var(--muted)',
            }}
          >
            {t('equipment:detail.notFound', {
              defaultValue: 'Listing not found.',
            })}
          </p>
        </div>
      </AppShell>
    );
  }


  const conditionLabel = listing.condition
    ? t(`equipment:condition.${listing.condition}`, {
        defaultValue: listing.condition,
      })
    : '—';


  const isSold = listing.status === 'closed';


  return (
    <AppShell
      title={t('equipment:nav.myListings')}
      onBack={() => navigate('/sell-equipment/listings')}
    >
      <div className="ld-page">

        {/* Hero */}
        <PhotoGallery
          photoUrls={listing.photoUrls}
          className="ld-hero"
          fallback={icon}
        >
          <span className="badge">
            <span
              className={`listing-card-status ${
                isSold ? 'sold' : ''
              }`}
            >
              {listing.status === 'published'
                ? t('equipment:detail.active')
                : listing.status}
            </span>
          </span>
        </PhotoGallery>


        {/* Title */}
        <h2 className="ld-title">
          {listing.itemName}
        </h2>


        {/* Price */}
        <p className="ld-price">
          ₹{Number(listing.price || 0).toLocaleString('en-IN')}
        </p>


        {/* Share */}
        {listing.status === 'published' && (
          <ShareListing
            url={`${window.location.origin}/buy-equipment/${listing.id}`}
            title={listing.itemName}
          />
        )}


        {/* Details */}
        <div className="ld-card">

          <div className="ld-row">
            <span>
              {t('equipment:detail.condition')}
            </span>

            <span>
              {conditionLabel}
            </span>
          </div>


          <div className="ld-row">
            <span>
              {t('equipment:detail.location')}
            </span>

            <span>
              {listing.location || '—'}
            </span>
          </div>


          <div className="ld-row">
            <span>
              {t('equipment:detail.phone')}
            </span>

            <span>
              {listing.phone || '—'}
            </span>
          </div>


          <div className="ld-row">
            <span>
              {t('equipment:detail.lastUpdated')}
            </span>

            <span>
              {listing.updatedAt
                ? formatRelativeTime(listing.updatedAt)
                : '—'}
            </span>
          </div>


          <div className="ld-row">
            <span>
              {t('equipment:detail.description')}
            </span>

            <span>
              {listing.description || '—'}
            </span>
          </div>

        </div>


        {/* Quick Actions */}
        <div className="ld-quick-actions">

          {/* Edit Price */}
          <button
            type="button"
            className="ld-qa-btn"
            onClick={() => {
              setPriceInput(String(listing.price || ''));
              setPriceInputError('');
              setSheet('price');
            }}
          >
            <span className="ic">💰</span>
            {t('equipment:detail.editPrice')}
          </button>


          {/* Mark Sold */}
          {!isSold ? (
            <button
              type="button"
              className="ld-qa-btn"
              onClick={() => {
                setSoldPrice(String(listing.price || ''));
                setSoldPriceError('');
                setSoldBuyer('');
                setSheet('sold');
              }}
            >
              <span className="ic">✅</span>
              {t('equipment:detail.markSold')}
            </button>
          ) : (
            <button
              type="button"
              className="ld-qa-btn ld-qa-disabled"
              disabled
            >
              <span className="ic">✅</span>
              {t('equipment:detail.sold')}
            </button>
          )}


          {/* Delete */}
          <button
            type="button"
            className="ld-qa-btn ld-qa-danger"
            onClick={handleDelete}
          >
            <span className="ic">🗑</span>
            {t('equipment:detail.delete')}
          </button>

        </div>


        {/* Edit Price Sheet */}
        <BottomSheet
          open={sheet === 'price'}
          onClose={() => setSheet(null)}
        >
          <h3>
            {t('equipment:detail.editPrice')}
          </h3>

          <div
            className={`ld-sheet-field${
              priceInputError ? ' has-error' : ''
            }`}
          >
            <label>
              {t('equipment:detail.newPrice')}
            </label>

            <input
              type="number"
              min="0"
              value={priceInput}
              onChange={(event) => {
                setPriceInput(event.target.value);
                setPriceInputError('');
              }}
            />

            {priceInputError && (
              <span className="ld-field-error">
                {priceInputError}
              </span>
            )}
          </div>


          <div className="ld-sheet-actions">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={() => setSheet(null)}
            >
              {t('equipment:detail.cancel')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleSavePrice}
            >
              {t('equipment:detail.save')}
            </button>
          </div>
        </BottomSheet>


        {/* Mark Sold Sheet */}
        <BottomSheet
          open={sheet === 'sold'}
          onClose={() => setSheet(null)}
        >
          <h3>
            {t('equipment:detail.markSoldTitle')}
          </h3>


          <div
            className={`ld-sheet-field${
              soldPriceError ? ' has-error' : ''
            }`}
          >
            <label>
              {t('equipment:detail.finalPrice')}
            </label>

            <input
              type="number"
              min="0"
              value={soldPrice}
              onChange={(event) => {
                setSoldPrice(event.target.value);
                setSoldPriceError('');
              }}
            />

            {soldPriceError && (
              <span className="ld-field-error">
                {soldPriceError}
              </span>
            )}
          </div>


          <div className="ld-sheet-field">
            <label>
              {t('equipment:detail.buyerName')}
            </label>

            <input
              type="text"
              value={soldBuyer}
              onChange={(event) =>
                setSoldBuyer(event.target.value)
              }
            />
          </div>


          <div className="ld-sheet-actions">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={() => setSheet(null)}
            >
              {t('equipment:detail.cancel')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleConfirmSold}
            >
              {t('equipment:detail.confirmSold')}
            </button>
          </div>
        </BottomSheet>

      </div>
    </AppShell>
  );
}