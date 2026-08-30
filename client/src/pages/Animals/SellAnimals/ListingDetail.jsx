import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getListingById,
  updateListing,
  deleteListing,
  markListingSold,
} from '../../../services/listingsService';
import { animalCatalog } from '../../../config/animalCatalog';
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
  const { t } = useTranslation(['animals', 'common']);
  const { showToast } = useToast();

  const [listing, setListing] = useState(undefined);
  const [sheet, setSheet] = useState(null); // 'price' | 'sold' | null

  const [priceInput, setPriceInput] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [soldBuyer, setSoldBuyer] = useState('');

  const [priceInputError, setPriceInputError] = useState('');
  const [soldPriceError, setSoldPriceError] = useState('');

  const icon =
    animalCatalog.find((animal) => animal.id === listing?.itemId)?.icon ??
    listing?.animalIcon ??
    '🐾';

  async function reload() {
    try {
      const result = await getListingById(id);
      setListing(result);
    } catch {
      setListing(null);
    }
  }

  useEffect(() => {
    reload();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (listing === undefined) {
    return (
      <AppShell
        title={t('animals:nav.myListings')}
        onBack={() => navigate('/sell-animal/listings')}
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
        title={t('animals:nav.myListings')}
        onBack={() => navigate('/sell-animal/listings')}
      >
        <div className="ld-page">
          <p
            style={{
              padding: 16,
              color: 'var(--muted)',
            }}
          >
            {t('common:notFound', 'Listing not found')}
          </p>
        </div>
      </AppShell>
    );
  }

  async function handleSavePrice() {
    const value = Number(priceInput);

    if (!value || value <= 0) {
      setPriceInputError(
        t('animals:create.validationPrice')
      );
      return;
    }

    setPriceInputError('');

    try {
      await updateListing(id, {
        price: value,
      });

      setSheet(null);

      showToast(
        t('animals:detail.priceUpdated')
      );

      await reload();
    } catch {
      showToast(
        t('common:somethingWentWrong', 'Something went wrong. Please try again.')
      );
    }
  }

  async function handleConfirmSold() {
    const price = Number(soldPrice);

    if (!price || price <= 0) {
      setSoldPriceError(
        t('animals:create.validationPrice')
      );
      return;
    }

    setSoldPriceError('');

    try {
      await markListingSold(id, {
        // Was hardcoded to 1 - harmless while every listing's own
        // quantity was also always 1, but Sell Animal's quantity field
        // is now farmer-editable, so a listing of e.g. 5 goats sold in
        // full needs to record 5, not silently understate it to 1.
        quantitySold: listing?.quantity ?? 1,
        saleAmount: price,
        buyerName: soldBuyer.trim() || 'Buyer',
      });

      setSheet(null);

      showToast(
        t('animals:detail.markedSold')
      );

      navigate('/sell-animal/listings');
    } catch {
      showToast(
        t('common:somethingWentWrong', 'Something went wrong. Please try again.')
      );
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      t('animals:detail.deleteConfirm')
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteListing(id);

      showToast(
        t('animals:detail.deleted')
      );

      navigate('/sell-animal/listings');
    } catch {
      showToast(
        t('common:somethingWentWrong', 'Something went wrong. Please try again.')
      );
    }
  }

  const isSold = listing.status === 'closed';

  return (
    <AppShell
      title={t('animals:nav.myListings')}
      onBack={() => navigate('/sell-animal/listings')}
    >
      <div className="ld-page">

        {/* Animal Photo / Icon */}
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
              {isSold
                ? t('animals:detail.sold')
                : t('animals:detail.active')}
            </span>
          </span>
        </PhotoGallery>

        {/* Animal Name */}
        <h2 className="ld-title">
          {listing.itemName || 'Animal'}
        </h2>

        {/* Total Price */}
        <p className="ld-price">
          ₹{Number(listing.price || 0).toLocaleString('en-IN')}
        </p>

        {/* Share */}
        {listing.status === 'published' && (
          <ShareListing
            url={`${window.location.origin}/buy-animal/${listing.id}`}
            title={listing.itemName}
          />
        )}

        {/* Details */}
        <div className="ld-card">
          <div className="ld-row">
            <span>
              {t('animals:detail.location')}
            </span>

            <span>
              {listing.location || '—'}
            </span>
          </div>

          <div className="ld-row">
            <span>
              {t('animals:detail.phone')}
            </span>

            <span>
              {listing.phone || '—'}
            </span>
          </div>

          <div className="ld-row">
            <span>
              {t('animals:detail.lastUpdated')}
            </span>

            <span>
              {listing.updatedAt
                ? formatRelativeTime(listing.updatedAt)
                : '—'}
            </span>
          </div>

          <div className="ld-row">
            <span>
              {t('animals:detail.description')}
            </span>

            <span>
              {listing.description || '—'}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ld-quick-actions">

          {/* Edit Price */}
          <div
            className="ld-qa-btn"
            onClick={() => {
              setPriceInput(String(listing.price ?? ''));
              setPriceInputError('');
              setSheet('price');
            }}
          >
            <span className="ic">💰</span>
            {t('animals:detail.editPrice')}
          </div>

          {/* Mark Sold */}
          {!isSold ? (
            <div
              className="ld-qa-btn"
              onClick={() => {
                setSoldPrice(
                  String(listing.price ?? '')
                );
                setSoldPriceError('');
                setSoldBuyer('');
                setSheet('sold');
              }}
            >
              <span className="ic">✅</span>
              {t('animals:detail.markSold')}
            </div>
          ) : (
            <div className="ld-qa-btn ld-qa-disabled">
              <span className="ic">✅</span>
              {t('animals:detail.sold')}
            </div>
          )}

          {/* Delete */}
          <div
            className="ld-qa-btn ld-qa-danger"
            onClick={handleDelete}
          >
            <span className="ic">🗑</span>
            {t('animals:detail.delete')}
          </div>
        </div>

        {/* Edit Price Sheet */}
        <BottomSheet
          open={sheet === 'price'}
          onClose={() => setSheet(null)}
        >
          <h3>
            {t('animals:detail.editPrice')}
          </h3>

          <div
            className={`ld-sheet-field${
              priceInputError ? ' has-error' : ''
            }`}
          >
            <label>
              {t('animals:detail.newPrice')}
            </label>

            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value);
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
              className="sticky-bar-secondary"
              onClick={() => setSheet(null)}
            >
              {t('animals:detail.cancel')}
            </button>

            <button
              className="sticky-bar-primary"
              onClick={handleSavePrice}
            >
              {t('animals:detail.save')}
            </button>
          </div>
        </BottomSheet>

        {/* Mark Sold Sheet */}
        <BottomSheet
          open={sheet === 'sold'}
          onClose={() => setSheet(null)}
        >
          <h3>
            {t('animals:detail.markSoldTitle')}
          </h3>

          <div
            className={`ld-sheet-field${
              soldPriceError ? ' has-error' : ''
            }`}
          >
            <label>
              {t('animals:detail.finalPrice')}
            </label>

            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={soldPrice}
              onChange={(e) => {
                setSoldPrice(e.target.value);
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
              {t('animals:detail.buyerName')}
            </label>

            <input
              type="text"
              value={soldBuyer}
              onChange={(e) =>
                setSoldBuyer(e.target.value)
              }
            />
          </div>

          <div className="ld-sheet-actions">
            <button
              className="sticky-bar-secondary"
              onClick={() => setSheet(null)}
            >
              {t('animals:detail.cancel')}
            </button>

            <button
              className="sticky-bar-primary"
              onClick={handleConfirmSold}
            >
              {t('animals:detail.confirmSold')}
            </button>
          </div>
        </BottomSheet>

      </div>
    </AppShell>
  );
}