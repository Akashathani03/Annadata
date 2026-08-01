import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListingById, updateListing, deleteListing, markListingSold } from '../../../services/listingsService';
import { getEnquiries } from '../../../services/enquiriesService';
import { animalCatalog } from '../../../config/animalCatalog';
import { useToast } from '../../../context/ToastContext';
import BottomSheet from '../../../components/common/BottomSheet';
import '../../Crops/SellCrop/ListingDetail.css';

// Quantity/Unit are not user-facing anywhere in this simplified module
// (every animal listing is implicitly "1 Head") - so unlike Sell Crop,
// there is no "Edit Qty" action here, and Mark Sold doesn't ask for a
// quantity either.
export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['animals', 'common']);
  const { showToast } = useToast();

  const [listing, setListing] = useState(undefined);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [sheet, setSheet] = useState(null); // 'price' | 'sold' | null

  const [priceInput, setPriceInput] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [soldBuyer, setSoldBuyer] = useState('');
  const [priceInputError, setPriceInputError] = useState('');
  const [soldPriceError, setSoldPriceError] = useState('');

  const icon = animalCatalog.find((a) => a.id === listing?.itemId)?.icon ?? '🐄';

  async function reload() {
    const [result, enquiries] = await Promise.all([
      getListingById(id),
      getEnquiries({ listingId: id }),
    ]);
    setListing(result);
    setEnquiryCount(enquiries.length);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (listing === undefined) {
    return (
      <div className="ld-page">
        <button className="ui-back-link" onClick={() => navigate('/sell-animal/listings')}>← {t('animals:myListings.details')}</button>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('common:loading')}</p>
      </div>
    );
  }
  if (listing === null) {
    return (
      <div className="ld-page">
        <button className="ui-back-link" onClick={() => navigate('/sell-animal/listings')}>← {t('animals:myListings.details')}</button>
      </div>
    );
  }

  async function handleSavePrice() {
    const value = Number(priceInput);
    if (!value || value <= 0) {
      setPriceInputError(t('animals:create.validationPrice'));
      return;
    }
    setPriceInputError('');
    await updateListing(id, { price: value });
    setSheet(null);
    showToast(t('animals:detail.priceUpdated'));
    reload();
  }

  async function handleConfirmSold() {
    const price = Number(soldPrice);
    if (!price || price <= 0) {
      setSoldPriceError(t('animals:create.validationPrice'));
      return;
    }
    setSoldPriceError('');

    await markListingSold(id, {
      quantitySold: 1,
      saleAmount: price,
      buyerName: soldBuyer || 'Buyer',
    });
    setSheet(null);
    showToast(t('animals:detail.markedSold'));
    navigate('/sell-animal/listings');
  }

  async function handleDelete() {
    if (!window.confirm(t('animals:detail.deleteConfirm'))) return;
    await deleteListing(id);
    showToast(t('animals:detail.deleted'));
    navigate('/sell-animal/listings');
  }

  return (
    <div className="ld-page">
      <div className="ld-hero">
        {listing.photoUrl ? <img src={listing.photoUrl} alt="" /> : icon}
        <span className="badge">
          <span className={`listing-card-status ${listing.status === 'sold' ? 'sold' : ''}`}>
            {listing.status === 'published' ? t('animals:detail.active') : listing.status}
          </span>
        </span>
      </div>

      <h2 className="ld-title">{listing.itemName}</h2>
      <p className="ld-price">₹{listing.price}</p>

      <div className="ld-card">
        <div className="ld-row"><span>{t('animals:detail.location')}</span><span>{listing.location || '—'}</span></div>
        <div className="ld-row"><span>{t('animals:detail.phone')}</span><span>{listing.phone || '—'}</span></div>
        <div className="ld-row"><span>{t('animals:detail.postedOn')}</span><span>{new Date(listing.createdAt).toLocaleString('en-IN')}</span></div>
        <div className="ld-row"><span>{t('animals:detail.lastUpdated')}</span><span>{new Date(listing.updatedAt).toLocaleString('en-IN')}</span></div>
        <div className="ld-row"><span>{t('animals:detail.description')}</span><span>{listing.description || '—'}</span></div>
      </div>

      <div className="ld-stat-row">
        <div className="ld-stat-card"><div className="lbl2">👁 {t('animals:detail.views')}</div><b>{listing.views || 0}</b></div>
        <div className="ld-stat-card"><div className="lbl2">💬 {t('animals:detail.enquiries')}</div><b>{enquiryCount}</b></div>
      </div>

      <div className="ld-quick-actions">
        <div className="ld-qa-btn" onClick={() => { setPriceInput(String(listing.price)); setPriceInputError(''); setSheet('price'); }}>
          <span className="ic">💰</span>{t('animals:detail.editPrice')}
        </div>
        {listing.status !== 'sold' ? (
          <div className="ld-qa-btn" onClick={() => { setSoldPrice(String(listing.price)); setSoldPriceError(''); setSheet('sold'); }}>
            <span className="ic">✅</span>{t('animals:detail.markSold')}
          </div>
        ) : (
          <div className="ld-qa-btn ld-qa-disabled"><span className="ic">✅</span>{t('animals:detail.sold')}</div>
        )}
        <div className="ld-qa-btn ld-qa-danger" onClick={handleDelete}>
          <span className="ic">🗑</span>{t('animals:detail.delete')}
        </div>
      </div>

      <BottomSheet open={sheet === 'price'} onClose={() => setSheet(null)}>
        <h3>{t('animals:detail.editPrice')}</h3>
        <div className={`ld-sheet-field${priceInputError ? ' has-error' : ''}`}>
          <label>{t('animals:detail.newPrice')}</label>
          <input type="number" value={priceInput} onChange={(e) => { setPriceInput(e.target.value); setPriceInputError(''); }} />
          {priceInputError && <span className="ld-field-error">{priceInputError}</span>}
        </div>
        <div className="ld-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setSheet(null)}>{t('animals:detail.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleSavePrice}>{t('animals:detail.save')}</button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'sold'} onClose={() => setSheet(null)}>
        <h3>{t('animals:detail.markSoldTitle')}</h3>
        <div className={`ld-sheet-field${soldPriceError ? ' has-error' : ''}`}>
          <label>{t('animals:detail.finalPrice')}</label>
          <input type="number" value={soldPrice} onChange={(e) => { setSoldPrice(e.target.value); setSoldPriceError(''); }} />
          {soldPriceError && <span className="ld-field-error">{soldPriceError}</span>}
        </div>
        <div className="ld-sheet-field">
          <label>{t('animals:detail.buyerName')}</label>
          <input type="text" value={soldBuyer} onChange={(e) => setSoldBuyer(e.target.value)} />
        </div>
        <div className="ld-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setSheet(null)}>{t('animals:detail.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleConfirmSold}>{t('animals:detail.confirmSold')}</button>
        </div>
      </BottomSheet>
    </div>
  );
}
