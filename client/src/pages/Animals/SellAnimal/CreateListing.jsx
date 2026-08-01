import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createListing, getListingById, updateListing } from '../../../services/listingsService';
import { getListingFieldConfig, unitMeta } from '../../../config/listingFieldConfig';
import { animalCategories } from '../../../config/animalCatalog';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import StepCard from '../../../components/common/StepCard';
import PhotoUpload from '../../../components/common/PhotoUpload';
import LocationCapture from '../../../components/common/LocationCapture';
import StickyActionBar from '../../../components/common/StickyActionBar';
import BottomSheet from '../../../components/common/BottomSheet';
import '../../Crops/SellCrop/CreateListing.css';
import '../../Shops/ManageShop/ManageShop.css';

const CATEGORY = 'animal';

// Mirrors Sell Crop's CreateListing structure/pattern closely (same
// step-card layout, same sticky bar, same success sheet), but genuinely
// reuses LocationCapture for the location step instead of building an
// inline version - Sell Crop's own screen predates LocationCapture and
// never got retrofitted to use it (a known, previously-flagged gap).
export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { t } = useTranslation(['listings', 'animals', 'common']);
  const { showToast } = useToast();
  const { user } = useAuth();
  const config = getListingFieldConfig(CATEGORY);

  const [animalCategory, setAnimalCategory] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [quantity, setQuantity] = useState(config.defaultQuantity);
  const [unit] = useState(config.unitOptions[0]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [locationValue, setLocationValue] = useState({ village: '', taluk: '', district: '', state: '', lat: null, lng: null });
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [publishedName, setPublishedName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (editId) {
      getListingById(editId).then((existing) => {
        if (!existing) return;
        setAnimalCategory(existing.itemId || '');
        setBreed(existing.breed || '');
        setAge(existing.age || '');
        setQuantity(existing.quantity);
        setPrice(String(existing.price));
        setDescription(existing.description || '');
        setPhoto(existing.photoUrl || '');
        setLocationValue({
          village: existing.locationVillage || '',
          taluk: existing.locationTaluk || '',
          district: existing.locationDistrict || '',
          state: existing.locationState || '',
          lat: existing.lat ?? null,
          lng: existing.lng ?? null,
        });
      });
    } else {
      setLocationValue({
        village: user.village || '',
        taluk: user.taluk || '',
        district: user.district || '',
        state: user.state || '',
        lat: user.lat ?? null,
        lng: user.lng ?? null,
      });
    }
  }, [editId, user]);

  function validate() {
    let valid = true;
    if (!animalCategory) {
      setCategoryError(t('animals:create.chooseCategory'));
      valid = false;
    } else {
      setCategoryError('');
    }
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

    const categoryMeta = animalCategories.find((c) => c.id === animalCategory);
    const itemName = categoryMeta ? t(categoryMeta.labelKey) : animalCategory;

    const payload = {
      ownerId: user.id,
      ownerType: 'farmer',
      category: CATEGORY,
      itemId: animalCategory,
      itemName,
      breed,
      age,
      quantity: Number(quantity),
      unit,
      price: Number(price),
      description,
      photoUrl: photo,
      location: [locationValue.village, locationValue.taluk, locationValue.district].filter(Boolean).join(', '),
      locationVillage: locationValue.village,
      locationTaluk: locationValue.taluk,
      locationDistrict: locationValue.district,
      locationState: locationValue.state,
      lat: locationValue.lat,
      lng: locationValue.lng,
      phone: user?.phone,
      status,
    };

    const listing = editId ? await updateListing(editId, payload) : await createListing(payload);
    setSaving(false);

    if (status === 'draft') {
      showToast(t('listings:create.draftSaved'));
      navigate('/sell-animal/listings');
      return;
    }
    setPublishedName(listing.itemName);
    setSuccessOpen(true);
  }

  function resetForm() {
    setAnimalCategory('');
    setBreed('');
    setAge('');
    setQuantity(config.defaultQuantity);
    setPrice('');
    setDescription('');
    setPhoto('');
    setLocationValue({
      village: user?.village || '', taluk: user?.taluk || '', district: user?.district || '',
      state: user?.state || '', lat: user?.lat ?? null, lng: user?.lng ?? null,
    });
  }

  return (
    <div className="create-listing-page">
      <p className="create-listing-subtitle">{t('animals:create.subtitle')}</p>

      <StepCard number={1} title={t('animals:create.step1Title')}>
        <div className="cl-field">
          <label>{t('animals:create.chooseCategory')} *</label>
          <div className="som-cat-grid">
            {animalCategories.map((c) => (
              <div
                key={c.id}
                className="som-cat-card"
                style={animalCategory === c.id ? { borderColor: 'var(--green-dark)', background: 'var(--green-light)' } : undefined}
                onClick={() => { setAnimalCategory(c.id); setCategoryError(''); }}
              >
                <span className="ic">{c.icon}</span>{t(c.labelKey)}
              </div>
            ))}
          </div>
          {categoryError && <span className="cl-field-error">{categoryError}</span>}
        </div>

        <div className="cl-row2">
          <div className="cl-field">
            <label>{t('animals:create.breed')}</label>
            <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder={t('animals:create.breedPlaceholder')} />
          </div>
          <div className="cl-field">
            <label>{t('animals:create.age')}</label>
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder={t('animals:create.agePlaceholder')} />
          </div>
        </div>

        <div className="cl-row2">
          <div className={`cl-field${quantityError ? ' has-error' : ''}`}>
            <label>{t('animals:create.quantity')} *</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setQuantityError(''); }}
            />
            {quantityError && <span className="cl-field-error">{quantityError}</span>}
          </div>
          <div className="cl-field">
            <label>{t('listings:create.unit')}</label>
            <input value={`${unitMeta[unit]?.icon} ${t(unitMeta[unit]?.labelKey)}`} disabled />
          </div>
        </div>

        <div className={`cl-field${priceError ? ' has-error' : ''}`}>
          <label>{t('animals:create.priceLabel', { unit: t(unitMeta[unit]?.labelKey) })} *</label>
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
        <LocationCapture value={locationValue} onChange={setLocationValue} />
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
        <p className="cl-success-body">{t('listings:create.successBody', { item: publishedName })}</p>
        <div className="cl-success-actions">
          <button className="sticky-bar-secondary" onClick={() => { setSuccessOpen(false); resetForm(); }}>
            {t('listings:create.addAnother')}
          </button>
          <button className="sticky-bar-primary" onClick={() => { setSuccessOpen(false); navigate('/sell-animal/listings'); }}>
            {t('listings:create.viewListing')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
