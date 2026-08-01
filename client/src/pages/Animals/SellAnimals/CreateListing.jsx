import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createListing, getListingById, updateListing } from '../../../services/listingsService';
import { animalCatalog } from '../../../config/animalCatalog';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import StepCard from '../../../components/common/StepCard';
import PhotoUpload from '../../../components/common/PhotoUpload';
import GpsLocationSection from '../../../components/common/GpsLocationSection';
import StickyActionBar from '../../../components/common/StickyActionBar';
import BottomSheet from '../../../components/common/BottomSheet';
import '../../Crops/SellCrop/CreateListing.css';

const CATEGORY = 'animal';

// Simplified on purpose: a farmer should be able to publish in under a
// minute. Only 6 fields exist - Animal Type, Photo, Title, Price,
// Location, Description. No quantity/unit/breed/age/etc, no separate
// category step, no contact-number field (phone comes from the
// logged-in user's own profile automatically).
export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { t } = useTranslation(['animals', 'listings', 'common']);
  const { showToast } = useToast();
  const { user } = useAuth();

  const [itemId, setItemId] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [locationParts, setLocationParts] = useState({ village: '', taluk: '', district: '', state: '' });
  const [coords, setCoords] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState('');

  const [itemError, setItemError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    if (!editId) {
      setLocationParts({
        village: user?.village || '',
        taluk: user?.taluk || '',
        district: user?.district || '',
        state: user?.state || '',
      });
      return;
    }
    let cancelled = false;
    getListingById(editId).then((existing) => {
      if (cancelled || !existing) return;
      setItemId(existing.itemId);
      setTitle(existing.itemName || '');
      setPrice(String(existing.price));
      setDescription(existing.description || '');
      setPhoto(existing.photoUrl || '');
      setLocationParts({
        village: existing.locationVillage || user?.village || '',
        taluk: existing.locationTaluk || user?.taluk || '',
        district: existing.locationDistrict || user?.district || '',
        state: existing.locationState || user?.state || '',
      });
      if (existing.lat != null && existing.lng != null) {
        setCoords({ lat: existing.lat, lng: existing.lng });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editId, user]);

  const selectedItem = useMemo(() => animalCatalog.find((a) => a.id === itemId), [itemId]);

  function resetForm() {
    setItemId('');
    setTitle('');
    setPrice('');
    setDescription('');
    setPhoto('');
  }

  function validate() {
    let valid = true;
    if (!itemId) {
      setItemError(t('animals:create.validationCategory'));
      valid = false;
    } else {
      setItemError('');
    }
    if (!photo) {
      setPhotoError(t('animals:create.validationPhoto'));
      valid = false;
    } else {
      setPhotoError('');
    }
    if (!title.trim()) {
      setTitleError(t('animals:create.validationTitle'));
      valid = false;
    } else {
      setTitleError('');
    }
    if (!price || Number(price) <= 0) {
      setPriceError(t('animals:create.validationPrice'));
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
      itemName: title.trim(),
      quantity: 1,
      unit: 'Head',
      price: Number(price),
      description: description.trim(),
      photoUrl: photo,
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
      showToast(t('animals:create.draftSaved'));
      navigate('/sell-animal/listings');
      return;
    }
    setPublishedTitle(listing.itemName);
    setSuccessOpen(true);
  }

  return (
    <div className="create-listing-page">
      <p className="create-listing-subtitle">{t('animals:create.subtitle')}</p>

      <StepCard number={1} title={t('animals:create.step1Title')}>
        <div className={`cl-field${itemError ? ' has-error' : ''}`}>
          <label>{t('animals:create.animalType')} *</label>
          <select value={itemId} onChange={(e) => { setItemId(e.target.value); setItemError(''); }}>
            <option value="">{t('animals:create.animalType')}</option>
            {animalCatalog.map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.name} / {a.kannadaName}</option>
            ))}
          </select>
          {itemError && <span className="cl-field-error">{itemError}</span>}
        </div>

        <div className={`cl-field${photoError ? ' has-error' : ''}`}>
          <label>{t('animals:create.uploadImage')} *</label>
          <PhotoUpload
            value={photo}
            onChange={(v) => { setPhoto(v); setPhotoError(''); }}
            label={t('animals:create.uploadLabel')}
            hint={t('animals:create.uploadHint')}
          />
          {photoError && <span className="cl-field-error">{photoError}</span>}
        </div>

        <div className={`cl-field${titleError ? ' has-error' : ''}`}>
          <label>{t('animals:create.titleLabel')} *</label>
          <input
            type="text"
            maxLength={60}
            placeholder={t('animals:create.titlePlaceholder')}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
          />
          {titleError && <span className="cl-field-error">{titleError}</span>}
        </div>

        <div className={`cl-field${priceError ? ' has-error' : ''}`}>
          <label>{t('animals:create.priceLabel')} *</label>
          <div className="cl-price-input">
            <span>₹</span>
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setPriceError(''); }}
            />
          </div>
          {priceError && <span className="cl-field-error">{priceError}</span>}
        </div>

        <div className="cl-field">
          <label>{t('animals:create.description')}</label>
          <textarea
            maxLength={200}
            placeholder={t('animals:create.descriptionPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <span className="cl-charcount">{description.length}/200</span>
        </div>
      </StepCard>

      <StepCard number={2} title={t('animals:create.step2Title')}>
        <GpsLocationSection
          locationParts={locationParts}
          onLocationPartsChange={setLocationParts}
          coords={coords}
          onCoordsChange={setCoords}
        />
      </StepCard>

      <div style={{ height: 80 }} />

      <div className="cl-sticky-bar">
        <StickyActionBar
          secondaryLabel={t('animals:create.saveDraft')}
          onSecondary={() => handleSave('draft')}
          primaryLabel={t('animals:create.publishListing')}
          onPrimary={() => handleSave('published')}
          primaryLoading={saving}
        />
      </div>

      <BottomSheet open={successOpen} onClose={() => setSuccessOpen(false)}>
        <div className="cl-success-icon">✅</div>
        <h3 className="cl-success-title">{t('animals:create.successTitle')}</h3>
        <p className="cl-success-body">{t('animals:create.successBody', { item: publishedTitle })}</p>
        <div className="cl-success-actions">
          <button
            className="sticky-bar-secondary"
            onClick={() => { setSuccessOpen(false); resetForm(); }}
          >
            {t('animals:create.addAnother')}
          </button>
          <button
            className="sticky-bar-primary"
            onClick={() => { setSuccessOpen(false); navigate('/sell-animal/listings'); }}
          >
            {t('animals:create.viewListing')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
