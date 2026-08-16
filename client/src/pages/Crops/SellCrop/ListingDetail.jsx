import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getListingById,
  updateListing,
  deleteListing,
  markListingSold,
} from '../../../services/listingsService';
import { getCropCatalog } from '../../../services/marketPricesService';
import { useToast } from '../../../context/ToastContext';
import { formatRelativeTime } from '../../../utils/formatDate';
import AppShell from '../../../components/common/AppShell';
import ShareListing from '../../../components/common/ShareListing';
import BottomSheet from '../../../components/common/BottomSheet';
import PhotoGallery from '../../../components/common/PhotoGallery';
import './ListingDetail.css';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { t } = useTranslation(['listings', 'common']);
  const { showToast } = useToast();

  const [listing, setListing] = useState(undefined);
  const [icon, setIcon] = useState('🌾');

  const [sheet, setSheet] = useState(null);
  // price | qty | sold | null

  const [priceInput, setPriceInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [soldQty, setSoldQty] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [soldBuyer, setSoldBuyer] = useState('');

  const [priceInputError, setPriceInputError] = useState('');
  const [qtyInputError, setQtyInputError] = useState('');
  const [soldQtyError, setSoldQtyError] = useState('');
  const [soldPriceError, setSoldPriceError] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  /*
   * Loads the listing and crop icon independently.
   *
   * The listing is the primary data. If the crop catalog fails,
   * the listing should still be displayed with the default icon.
   */
  async function reload(isCancelled = () => false) {
    try {
      const result = await getListingById(id);

      if (isCancelled()) return;

      setListing(result);

      if (!result) {
        setIcon('🌾');
        return;
      }

      /*
       * Load the crop icon separately.
       * Failure here must not make the listing fail.
       */
      try {
        const catalog = await getCropCatalog();

        if (isCancelled()) return;

        setIcon(
          catalog.find(
            (crop) => crop.id === result.itemId
          )?.icon ?? '🌾'
        );
      } catch {
        if (isCancelled()) return;
        setIcon('🌾');
      }
    } catch {
      if (isCancelled()) return;

      setListing(null);
      setIcon('🌾');

      showToast(t('listings:detail.loadFailed'));
    }
  }

  useEffect(() => {
    let cancelled = false;

    setListing(undefined);
    setIcon('🌾');

    reload(() => cancelled);

    return () => {
      cancelled = true;
    };
    // reload intentionally depends on the current route id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (listing === undefined) {
    return (
      <AppShell
        title={t('listings:nav.myListings')}
        onBack={() => navigate('/sell/listings')}
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
        title={t('listings:nav.myListings')}
        onBack={() => navigate('/sell/listings')}
      >
        <div className="ld-page">
          <p
            style={{
              padding: 16,
              color: 'var(--muted)',
            }}
          >
            {t('listings:detail.notFound')}
          </p>
        </div>
      </AppShell>
    );
  }

  async function handleSavePrice() {
    const value = Number(priceInput);

    if (!value || value <= 0) {
      setPriceInputError(
        t('listings:create.validationPrice')
      );
      return;
    }

    if (actionLoading) return;

    setPriceInputError('');
    setActionLoading(true);

    try {
      await updateListing(id, {
        price: value,
      });

      setSheet(null);

      showToast(
        t('listings:detail.priceUpdated')
      );

      await reload();
    } catch {
      showToast(
        t('listings:detail.updateFailed')
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveQty() {
    const value = Number(qtyInput);

    if (!value || value <= 0) {
      setQtyInputError(
        t('listings:create.validationQuantity')
      );
      return;
    }

    if (actionLoading) return;

    setQtyInputError('');
    setActionLoading(true);

    try {
      await updateListing(id, {
        quantity: value,
      });

      setSheet(null);

      showToast(
        t('listings:detail.quantityUpdated')
      );

      await reload();
    } catch {
      showToast(
        t('listings:detail.updateFailed')
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmSold() {
    const qty = Number(soldQty);
    const price = Number(soldPrice);

    let valid = true;

    if (!qty || qty <= 0) {
      setSoldQtyError(
        t('listings:create.validationQuantity')
      );
      valid = false;
    } else if (
      Number(listing.quantity) > 0 &&
      qty > Number(listing.quantity)
    ) {
      setSoldQtyError(
        t('listings:detail.soldQuantityTooHigh')
      );
      valid = false;
    } else {
      setSoldQtyError('');
    }

    if (!price || price <= 0) {
      setSoldPriceError(
        t('listings:create.validationPrice')
      );
      valid = false;
    } else {
      setSoldPriceError('');
    }

    if (!valid || actionLoading) return;

    setActionLoading(true);

    try {
      await markListingSold(id, {
        quantitySold: qty,
        saleAmount: price,
        buyerName: soldBuyer.trim() || 'Buyer',
      });

      setSheet(null);

      showToast(
        t('listings:detail.markedSold')
      );

      navigate('/sell/listings');
    } catch {
      showToast(
        t('listings:detail.markSoldFailed')
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (actionLoading) return;

    if (
      !window.confirm(
        t('listings:detail.deleteConfirm')
      )
    ) {
      return;
    }

    setActionLoading(true);

    try {
      await deleteListing(id);

      showToast(
        t('listings:detail.deleted')
      );

      navigate('/sell/listings');
    } catch {
      showToast(
        t('listings:detail.deleteFailed')
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell
      title={t('listings:nav.myListings')}
      onBack={() => navigate('/sell/listings')}
    >
      <div className="ld-page">
        <PhotoGallery
          photoUrls={listing.photoUrls}
          className="ld-hero"
          fallback={icon}
        >
          <span className="badge">
            <span
              className={`listing-card-status${
                listing.status === 'closed'
                  ? ' sold'
                  : ''
              }`}
            >
              {listing.status === 'published'
                ? t('listings:detail.active')
                : listing.status}
            </span>
          </span>
        </PhotoGallery>

        <h2 className="ld-title">
          {listing.itemName}
        </h2>

        <p className="ld-qty">
          {listing.quantity} {listing.unit}
        </p>

        <p className="ld-price">
          ₹{listing.price} / {listing.unit}
        </p>

        {listing.status === 'published' && (
          <ShareListing
            url={`${window.location.origin}/buy/${listing.id}`}
            title={listing.itemName}
          />
        )}

        <div className="ld-card">
          <div className="ld-row">
            <span>
              {t('listings:detail.location')}
            </span>
            <span>
              {listing.location || '—'}
            </span>
          </div>

          <div className="ld-row">
            <span>
              {t('listings:detail.phone')}
            </span>
            <span>
              {listing.phone || '—'}
            </span>
          </div>

          <div className="ld-row">
            <span>
              {t('listings:detail.lastUpdated')}
            </span>
            <span>
              {formatRelativeTime(
                listing.updatedAt
              )}
            </span>
          </div>

          <div className="ld-row">
            <span>
              {t('listings:detail.description')}
            </span>
            <span>
              {listing.description || '—'}
            </span>
          </div>
        </div>

        <div className="ld-quick-actions">
          <div
            className="ld-qa-btn"
            onClick={() => {
              if (actionLoading) return;

              setPriceInput(
                String(listing.price)
              );
              setPriceInputError('');
              setSheet('price');
            }}
          >
            <span className="ic">💰</span>
            {t('listings:detail.editPrice')}
          </div>

          <div
            className="ld-qa-btn"
            onClick={() => {
              if (actionLoading) return;

              setQtyInput(
                String(listing.quantity)
              );
              setQtyInputError('');
              setSheet('qty');
            }}
          >
            <span className="ic">⚖️</span>
            {t('listings:detail.editQty')}
          </div>

          {listing.status !== 'closed' ? (
            <div
              className="ld-qa-btn"
              onClick={() => {
                if (actionLoading) return;

                setSoldQty(
                  String(listing.quantity)
                );
                setSoldPrice(
                  String(listing.price)
                );
                setSoldBuyer('');
                setSoldQtyError('');
                setSoldPriceError('');
                setSheet('sold');
              }}
            >
              <span className="ic">✅</span>
              {t('listings:detail.markSold')}
            </div>
          ) : (
            <div className="ld-qa-btn ld-qa-disabled">
              <span className="ic">✅</span>
              {t('listings:detail.sold')}
            </div>
          )}

          <div
            className={`ld-qa-btn ld-qa-danger${
              actionLoading ? ' disabled' : ''
            }`}
            onClick={handleDelete}
          >
            <span className="ic">🗑</span>
            {t('listings:detail.delete')}
          </div>
        </div>

        <BottomSheet
          open={sheet === 'price'}
          onClose={() => {
            if (!actionLoading) {
              setSheet(null);
            }
          }}
        >
          <h3>
            {t('listings:detail.editPrice')}
          </h3>

          <div
            className={`ld-sheet-field${
              priceInputError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t('listings:detail.newPrice')}
            </label>

            <input
              type="number"
              min="1"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value);
                setPriceInputError('');
              }}
              disabled={actionLoading}
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
              disabled={actionLoading}
            >
              {t('listings:detail.cancel')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleSavePrice}
              disabled={actionLoading}
            >
              {t('listings:detail.save')}
            </button>
          </div>
        </BottomSheet>

        <BottomSheet
          open={sheet === 'qty'}
          onClose={() => {
            if (!actionLoading) {
              setSheet(null);
            }
          }}
        >
          <h3>
            {t('listings:detail.editQty')}
          </h3>

          <div
            className={`ld-sheet-field${
              qtyInputError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t('listings:detail.newQuantity')}
            </label>

            <input
              type="number"
              min="1"
              value={qtyInput}
              onChange={(e) => {
                setQtyInput(e.target.value);
                setQtyInputError('');
              }}
              disabled={actionLoading}
            />

            {qtyInputError && (
              <span className="ld-field-error">
                {qtyInputError}
              </span>
            )}
          </div>

          <div className="ld-sheet-actions">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={() => setSheet(null)}
              disabled={actionLoading}
            >
              {t('listings:detail.cancel')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleSaveQty}
              disabled={actionLoading}
            >
              {t('listings:detail.save')}
            </button>
          </div>
        </BottomSheet>

        <BottomSheet
          open={sheet === 'sold'}
          onClose={() => {
            if (!actionLoading) {
              setSheet(null);
            }
          }}
        >
          <h3>
            {t('listings:detail.markSoldTitle')}
          </h3>

          <div
            className={`ld-sheet-field${
              soldQtyError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t('listings:detail.finalQuantity')}
            </label>

            <input
              type="number"
              min="1"
              value={soldQty}
              onChange={(e) => {
                setSoldQty(e.target.value);
                setSoldQtyError('');
              }}
              disabled={actionLoading}
            />

            {soldQtyError && (
              <span className="ld-field-error">
                {soldQtyError}
              </span>
            )}
          </div>

          <div
            className={`ld-sheet-field${
              soldPriceError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t('listings:detail.finalPrice')}
            </label>

            <input
              type="number"
              min="1"
              value={soldPrice}
              onChange={(e) => {
                setSoldPrice(e.target.value);
                setSoldPriceError('');
              }}
              disabled={actionLoading}
            />

            {soldPriceError && (
              <span className="ld-field-error">
                {soldPriceError}
              </span>
            )}
          </div>

          <div className="ld-sheet-field">
            <label>
              {t('listings:detail.buyerName')}
            </label>

            <input
              type="text"
              value={soldBuyer}
              onChange={(e) =>
                setSoldBuyer(e.target.value)
              }
              disabled={actionLoading}
            />
          </div>

          <div className="ld-sheet-actions">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={() => setSheet(null)}
              disabled={actionLoading}
            >
              {t('listings:detail.cancel')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleConfirmSold}
              disabled={actionLoading}
            >
              {t('listings:detail.confirmSold')}
            </button>
          </div>
        </BottomSheet>
      </div>
    </AppShell>
  );
}