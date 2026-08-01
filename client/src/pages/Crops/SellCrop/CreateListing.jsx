import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCropCatalog, getApmcMarkets, getCropPriceDetail } from '../../../services/marketPricesService';
import { createListing, getListingById, updateListing } from '../../../services/listingsService';
import { distanceKm, findNearest } from '../../../utils/geo';
import { getListingFieldConfig, unitMeta } from '../../../config/listingFieldConfig';
import { useAuth } from '../../../context/AuthContext';
import { DEFAULT_LOCATION } from '../../../config/constants';
import { useToast } from '../../../context/ToastContext';
import StepCard from '../../../components/common/StepCard';
import PhotoUpload from '../../../components/common/PhotoUpload';
import GpsLocationSection from '../../../components/common/GpsLocationSection';
import { PriceGrid, PriceBox } from '../../../components/common/PriceBox';
import StickyActionBar from '../../../components/common/StickyActionBar';
import BottomSheet from '../../../components/common/BottomSheet';
import './CreateListing.css';

const CATEGORY = 'crop';

export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { t } = useTranslation(['listings', 'marketPrices', 'common']);
  const { showToast } = useToast();
  const { user } = useAuth();
  const config = getListingFieldConfig(CATEGORY);

  const [catalog, setCatalog] = useState([]);
  const [apmcs, setApmcs] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(config.defaultQuantity);
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [priceTouched, setPriceTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [apmcId, setApmcId] = useState('');
  const [locationParts, setLocationParts] = useState({ village: '', taluk: '', district: '', state: '' });
  const [coords, setCoords] = useState(null); // { lat, lng } - kept for nearby APMC/buyer/distance use later
  const [apmcManuallySelected, setApmcManuallySelected] = useState(false);
  const [marketPrice, setMarketPrice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [publishedItemName, setPublishedItemName] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getCropCatalog(),
      getApmcMarkets({ lat: user?.lat ?? DEFAULT_LOCATION.lat, lng: user?.lng ?? DEFAULT_LOCATION.lng }),
      editId ? getListingById(editId) : Promise.resolve(null),
    ]).then(([cropList, apmcList, existingListing]) => {
      if (cancelled) return;
      setCatalog(cropList);
      setApmcs(apmcList);

        if (existingListing) {
          setItemId(existingListing.itemId);
          setQuantity(existingListing.quantity);
          setUnit(existingListing.unit);
          setPrice(String(existingListing.price));
          setPriceTouched(true);
          setDescription(existingListing.description || '');
          setPhoto(existingListing.photoUrl || '');
          setApmcId(existingListing.apmcId);
          setLocationParts({
            village: existingListing.locationVillage || user?.village || '',
            taluk: existingListing.locationTaluk || user?.taluk || '',
            district: existingListing.locationDistrict || user?.district || '',
            state: existingListing.locationState || user?.state || '',
          });
          if (existingListing.lat != null && existingListing.lng != null) {
            setCoords({ lat: existingListing.lat, lng: existingListing.lng });
          }
        } else {
          if (cropList.length) setItemId(cropList[0].id);
          const nearest = apmcList.find((a) => a.isNearest) ?? apmcList[0];
          if (nearest) setApmcId(nearest.id);
          setLocationParts({
            village: user?.village || '',
            taluk: user?.taluk || '',
            district: user?.district || '',
            state: user?.state || '',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [editId, user]);

  const selectedItem = useMemo(() => catalog.find((c) => c.id === itemId), [catalog, itemId]);
  const selectedApmc = useMemo(() => apmcs.find((a) => a.id === apmcId), [apmcs, apmcId]);

  useEffect(() => {
    if (selectedItem && !unit) setUnit(selectedItem.defaultUnit);
  }, [selectedItem, unit]);

  // Keeps the APMC selection in sync with the farmer's location. Runs
  // whenever coordinates change (i.e. after a fresh "Use Current
  // Location") and re-picks the nearest APMC by real distance - unless
  // the farmer has manually chosen a different one since the last
  // location update, in which case their choice is respected.
  useEffect(() => {
    if (!coords || apmcManuallySelected || apmcs.length === 0) return;
    const nearest = findNearest(coords.lat, coords.lng, apmcs);
    if (nearest) setApmcId(nearest.item.id);
  }, [coords, apmcs, apmcManuallySelected]);

  useEffect(() => {
    let cancelled = false;
    if (!itemId || !apmcId) return;
    getCropPriceDetail(apmcId, itemId).then((detail) => {
      if (cancelled) return;
      setMarketPrice(detail);
      if (detail && !priceTouched) setPrice(String(detail.modalPrice));
    });
    return () => {
      cancelled = true;
    };
  }, [itemId, apmcId, priceTouched]);

  function resetForm() {
    setItemId(catalog[0]?.id ?? '');
    setQuantity(config.defaultQuantity);
    setUnit(catalog[0]?.defaultUnit ?? '');
    setPrice('');
    setPriceTouched(false);
    setDescription('');
    setPhoto('');
    setApmcId(apmcs.find((a) => a.isNearest)?.id ?? apmcs[0]?.id ?? '');
  }

  function validate() {
    let valid = true;
    if (!quantity || Number(quantity) <= 0) {
      setQuantityError(t('listings:create.validationQuantity'));
      valid = false;
    } else {
      setQuantityError('');
    }
    if (!price || Number(price) <= 0) {
      setPriceError(t('listings:create.validationPrice'));
      valid = false;
    } else {
      setPriceError('');
    }
    return valid;
  }

  async function handleSave(status) {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      ownerId: user.id,
      ownerType: 'farmer',
      category: CATEGORY,
      itemId,
      itemName: selectedItem?.name ?? '',
      quantity: Number(quantity),
      unit,
      price: Number(price),
      description,
      photoUrl: photo,
      apmcId,
      apmcName: selectedApmc?.name ?? '',
      location: [locationParts.village, locationParts.taluk, locationParts.district].filter(Boolean).join(', '),
      locationVillage: locationParts.village,
      locationTaluk: locationParts.taluk,
      locationDistrict: locationParts.district,
      locationState: locationParts.state,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      phone: user?.phone,
      status,
    };

    const listing = editId ? await updateListing(editId, payload) : await createListing(payload);
    setSaving(false);

    if (status === 'draft') {
      showToast(t('listings:create.draftSaved'));
      navigate('/sell/listings');
      return;
    }
    setPublishedItemName(listing.itemName);
    setSuccessOpen(true);
  }

  return (
    <div className="create-listing-page">
      <p className="create-listing-subtitle">{t('listings:create.subtitle')}</p>

      <StepCard number={1} title={t('listings:create.step1Title')}>
        <div className="cl-field">
          <label>{t('listings:create.cropName')} *</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name} / {c.kannadaName}</option>
            ))}
          </select>
        </div>

        <div className="cl-row2">
          <div className={`cl-field${quantityError ? ' has-error' : ''}`}>
            <label>{t('listings:create.quantity')} *</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setQuantityError(''); }}
            />
            {quantityError && <span className="cl-field-error">{quantityError}</span>}
          </div>
          <div className="cl-field">
            <label>{t('listings:create.unit')} *</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="">{t('listings:create.selectUnit')}</option>
              {config.unitOptions.map((u) => (
                <option key={u} value={u}>{unitMeta[u]?.icon} {t(unitMeta[u]?.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`cl-field${priceError ? ' has-error' : ''}`}>
          <label>{t('listings:create.priceLabel', { unit: unit || config.unitOptions[0] })} *</label>
          <div className="cl-price-input">
            <span>₹</span>
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setPriceTouched(true); setPriceError(''); }}
            />
          </div>
          {priceError && <span className="cl-field-error">{priceError}</span>}
        </div>

        <div className="cl-field">
          <label>{t('listings:create.description')}</label>
          <textarea
            maxLength={200}
            placeholder={t('listings:create.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <span className="cl-charcount">{description.length}/200</span>
        </div>

        <div className="cl-field">
          <label>{t('listings:create.uploadImage')}</label>
          <PhotoUpload
            value={photo}
            onChange={setPhoto}
            label={t('listings:create.uploadLabel')}
            hint={t('listings:create.uploadHint')}
          />
        </div>
      </StepCard>

      <StepCard number={2} title={t('listings:create.step2Title')}>
        <GpsLocationSection
          locationParts={locationParts}
          onLocationPartsChange={setLocationParts}
          coords={coords}
          onCoordsChange={setCoords}
        />

        <div className="cl-loc-box">
          <div className="lbl">{t('listings:create.apmcMarket')} ℹ️</div>
          <select
            className="cl-loc-select"
            value={apmcId}
            onChange={(e) => { setApmcId(e.target.value); setApmcManuallySelected(true); }}
          >
            {apmcs.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {selectedApmc && (
            <div className="cl-dist">
              {(coords && selectedApmc.location
                ? distanceKm(coords.lat, coords.lng, selectedApmc.location.lat, selectedApmc.location.lng)?.toFixed(1)
                : selectedApmc.distanceKm)} km away
            </div>
          )}
        </div>

        <div className="cl-info-note">ℹ️ {t('listings:create.apmcInfoNote')}</div>
      </StepCard>

      <StepCard number={3} title={t('listings:create.step3Title')}>
        <div className="cl-market-head">
          <div className="cl-market-head-left">
            <span className="icon">🏛️</span>
            <div><b>{selectedApmc?.name}</b><span>{t('listings:create.todaysMarketPrice')}</span></div>
          </div>
          <div className="cl-official-badge">
            <span className="dot">✓</span>
            <div>{t('listings:create.officialGovData')}<small>{t('listings:create.sourceLabel')}</small></div>
          </div>
        </div>
        {marketPrice ? (
          <>
            <PriceGrid>
              <PriceBox label={t('marketPrices:minimumPrice')} value={marketPrice.minPrice} unitLabel={t('marketPrices:perKg')} tone="red" />
              <PriceBox label={t('marketPrices:modalPrice')} value={marketPrice.modalPrice} unitLabel={t('marketPrices:perKg')} tone="green" highlight tag={t('marketPrices:mostCommonPrice')} />
              <PriceBox label={t('marketPrices:maximumPrice')} value={marketPrice.maxPrice} unitLabel={t('marketPrices:perKg')} tone="orange" />
            </PriceGrid>
            <div className="cl-market-updated">
              🕐 {t('listings:create.updatedToday', {
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              })}
            </div>
          </>
        ) : (
          <p className="cl-no-price">{t('marketPrices:notFound')}</p>
        )}
      </StepCard>

      <div style={{ height: 80 }} />

      <div className="cl-sticky-bar">
        <StickyActionBar
          secondaryLabel={t('listings:create.saveDraft')}
          onSecondary={() => handleSave('draft')}
          primaryLabel={t('listings:create.publishListing')}
          onPrimary={() => handleSave('published')}
          primaryLoading={saving}
        />
      </div>

      <BottomSheet open={successOpen} onClose={() => setSuccessOpen(false)}>
        <div className="cl-success-icon">✅</div>
        <h3 className="cl-success-title">{t('listings:create.successTitle')}</h3>
        <p className="cl-success-body">{t('listings:create.successBody', { item: publishedItemName })}</p>
        <div className="cl-success-actions">
          <button
            className="sticky-bar-secondary"
            onClick={() => { setSuccessOpen(false); resetForm(); }}
          >
            {t('listings:create.addAnother')}
          </button>
          <button
            className="sticky-bar-primary"
            onClick={() => { setSuccessOpen(false); navigate('/sell/listings'); }}
          >
            {t('listings:create.viewListing')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
