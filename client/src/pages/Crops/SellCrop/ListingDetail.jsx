import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getListingById, updateListing, deleteListing, markListingSold } from '../../../services/listingsService';
import { getEnquiries } from '../../../services/enquiriesService';
import { getCropCatalog } from '../../../services/marketPricesService';
import { useToast } from '../../../context/ToastContext';
import BottomSheet from '../../../components/common/BottomSheet';
import './ListingDetail.css';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['listings', 'common']);
  const { showToast } = useToast();

  const [listing, setListing] = useState(undefined);
  const [icon, setIcon] = useState('🌾');
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [sheet, setSheet] = useState(null); // 'price' | 'qty' | 'sold' | null

  const [priceInput, setPriceInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [soldQty, setSoldQty] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [soldBuyer, setSoldBuyer] = useState('');
  const [priceInputError, setPriceInputError] = useState('');
  const [qtyInputError, setQtyInputError] = useState('');
  const [soldQtyError, setSoldQtyError] = useState('');
  const [soldPriceError, setSoldPriceError] = useState('');

  async function reload() {
    const [result, catalog, enquiries] = await Promise.all([
      getListingById(id),
      getCropCatalog(),
      getEnquiries({ listingId: id }),
    ]);
    setListing(result);
    setIcon(catalog.find((c) => c.id === result?.itemId)?.icon ?? '🌾');
    setEnquiryCount(enquiries.length);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (listing === undefined) {
    return (
      <div className="ld-page">
        <button className="ui-back-link" onClick={() => navigate('/sell/listings')}>← {t('listings:myListings.details')}</button>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('common:loading')}</p>
      </div>
    );
  }
  if (listing === null) {
    return (
      <div className="ld-page">
        <button className="ui-back-link" onClick={() => navigate('/sell/listings')}>← {t('listings:myListings.details')}</button>
      </div>
    );
  }

  async function handleSavePrice() {
    const value = Number(priceInput);
    if (!value || value <= 0) {
      setPriceInputError(t('listings:create.validationPrice'));
      return;
    }
    setPriceInputError('');
    await updateListing(id, { price: value });
    setSheet(null);
    showToast(t('listings:detail.priceUpdated'));
    reload();
  }

  async function handleSaveQty() {
    const value = Number(qtyInput);
    if (!value || value <= 0) {
      setQtyInputError(t('listings:create.validationQuantity'));
      return;
    }
    setQtyInputError('');
    await updateListing(id, { quantity: value });
    setSheet(null);
    showToast(t('listings:detail.quantityUpdated'));
    reload();
  }

  async function handleConfirmSold() {
    const qty = Number(soldQty);
    const price = Number(soldPrice);
    let valid = true;
    if (!qty || qty <= 0) {
      setSoldQtyError(t('listings:create.validationQuantity'));
      valid = false;
    } else {
      setSoldQtyError('');
    }
    if (!price || price <= 0) {
      setSoldPriceError(t('listings:create.validationPrice'));
      valid = false;
    } else {
      setSoldPriceError('');
    }
    if (!valid) return;

    await markListingSold(id, {
      quantitySold: qty,
      saleAmount: price,
      buyerName: soldBuyer || 'Buyer',
    });
    setSheet(null);
    showToast(t('listings:detail.markedSold'));
    navigate('/sell/listings');
  }

  async function handleDelete() {
    if (!window.confirm(t('listings:detail.deleteConfirm'))) return;
    await deleteListing(id);
    showToast(t('listings:detail.deleted'));
    navigate('/sell/listings');
  }

  return (
    <div className="ld-page">
      <div className="ld-hero">
        {listing.photoUrl ? <img src={listing.photoUrl} alt="" /> : icon}
        <span className="badge">
          <span className={`listing-card-status ${listing.status === 'sold' ? 'sold' : ''}`}>
            {listing.status === 'published' ? t('listings:detail.active') : listing.status}
          </span>
        </span>
      </div>

      <h2 className="ld-title">{listing.itemName}</h2>
      <p className="ld-qty">{listing.quantity} {listing.unit}</p>
      <p className="ld-price">₹{listing.price} / {listing.unit}</p>

      <div className="ld-card">
        <div className="ld-row"><span>{t('listings:detail.location')}</span><span>{listing.location || '—'}</span></div>
        <div className="ld-row"><span>{t('listings:detail.apmcMarket')}</span><span>{listing.apmcName || '—'}</span></div>
        <div className="ld-row"><span>{t('listings:detail.phone')}</span><span>{listing.phone || '—'}</span></div>
        <div className="ld-row"><span>{t('listings:detail.postedOn')}</span><span>{new Date(listing.createdAt).toLocaleString('en-IN')}</span></div>
        <div className="ld-row"><span>{t('listings:detail.lastUpdated')}</span><span>{new Date(listing.updatedAt).toLocaleString('en-IN')}</span></div>
        <div className="ld-row"><span>{t('listings:detail.description')}</span><span>{listing.description || '—'}</span></div>
      </div>

      <div className="ld-stat-row">
        <div className="ld-stat-card"><div className="lbl2">👁 {t('listings:detail.views')}</div><b>{listing.views || 0}</b></div>
        <div className="ld-stat-card"><div className="lbl2">💬 {t('listings:detail.enquiries')}</div><b>{enquiryCount}</b></div>
      </div>

      <div className="ld-quick-actions">
        <div className="ld-qa-btn" onClick={() => { setPriceInput(String(listing.price)); setPriceInputError(''); setSheet('price'); }}>
          <span className="ic">💰</span>{t('listings:detail.editPrice')}
        </div>
        <div className="ld-qa-btn" onClick={() => { setQtyInput(String(listing.quantity)); setQtyInputError(''); setSheet('qty'); }}>
          <span className="ic">⚖️</span>{t('listings:detail.editQty')}
        </div>
        {listing.status !== 'sold' ? (
          <div className="ld-qa-btn" onClick={() => { setSoldQty(String(listing.quantity)); setSoldPrice(String(listing.price)); setSoldQtyError(''); setSoldPriceError(''); setSheet('sold'); }}>
            <span className="ic">✅</span>{t('listings:detail.markSold')}
          </div>
        ) : (
          <div className="ld-qa-btn ld-qa-disabled"><span className="ic">✅</span>{t('listings:detail.sold')}</div>
        )}
        <div className="ld-qa-btn ld-qa-danger" onClick={handleDelete}>
          <span className="ic">🗑</span>{t('listings:detail.delete')}
        </div>
      </div>

      <BottomSheet open={sheet === 'price'} onClose={() => setSheet(null)}>
        <h3>{t('listings:detail.editPrice')}</h3>
        <div className={`ld-sheet-field${priceInputError ? ' has-error' : ''}`}>
          <label>{t('listings:detail.newPrice')}</label>
          <input type="number" value={priceInput} onChange={(e) => { setPriceInput(e.target.value); setPriceInputError(''); }} />
          {priceInputError && <span className="ld-field-error">{priceInputError}</span>}
        </div>
        <div className="ld-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setSheet(null)}>{t('listings:detail.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleSavePrice}>{t('listings:detail.save')}</button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'qty'} onClose={() => setSheet(null)}>
        <h3>{t('listings:detail.editQty')}</h3>
        <div className={`ld-sheet-field${qtyInputError ? ' has-error' : ''}`}>
          <label>{t('listings:detail.newQuantity')}</label>
          <input type="number" value={qtyInput} onChange={(e) => { setQtyInput(e.target.value); setQtyInputError(''); }} />
          {qtyInputError && <span className="ld-field-error">{qtyInputError}</span>}
        </div>
        <div className="ld-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setSheet(null)}>{t('listings:detail.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleSaveQty}>{t('listings:detail.save')}</button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'sold'} onClose={() => setSheet(null)}>
        <h3>{t('listings:detail.markSoldTitle')}</h3>
        <div className={`ld-sheet-field${soldQtyError ? ' has-error' : ''}`}>
          <label>{t('listings:detail.finalQuantity')}</label>
          <input type="number" value={soldQty} onChange={(e) => { setSoldQty(e.target.value); setSoldQtyError(''); }} />
          {soldQtyError && <span className="ld-field-error">{soldQtyError}</span>}
        </div>
        <div className={`ld-sheet-field${soldPriceError ? ' has-error' : ''}`}>
          <label>{t('listings:detail.finalPrice')}</label>
          <input type="number" value={soldPrice} onChange={(e) => { setSoldPrice(e.target.value); setSoldPriceError(''); }} />
          {soldPriceError && <span className="ld-field-error">{soldPriceError}</span>}
        </div>
        <div className="ld-sheet-field">
          <label>{t('listings:detail.buyerName')}</label>
          <input type="text" value={soldBuyer} onChange={(e) => setSoldBuyer(e.target.value)} />
        </div>
        <div className="ld-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setSheet(null)}>{t('listings:detail.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleConfirmSold}>{t('listings:detail.confirmSold')}</button>
        </div>
      </BottomSheet>
    </div>
  );
}
