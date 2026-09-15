import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  createListing,
  getListingById,
  updateListing,
} from '../../../services/listingsService';

import { animalCatalog } from '../../../config/animalCatalog';
import { KARNATAKA } from '../../../data/karnatakaLocations';

import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

import AppShell from '../../../components/common/AppShell';
import StepCard from '../../../components/common/StepCard';
import MultiPhotoUpload from '../../../components/common/MultiPhotoUpload';
import GpsLocationSection from '../../../components/common/GpsLocationSection';
import LocationSuggestInput from '../../../components/common/LocationSuggestInput';
import StickyActionBar from '../../../components/common/StickyActionBar';
import BottomSheet from '../../../components/common/BottomSheet';

import '../../Crops/SellCrop/CreateListing.css';

const CATEGORY = 'animal';

export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get('edit');

  const { t } = useTranslation([
    'animals',
    'listings',
    'common',
    'navigation',
  ]);

  const { showToast } = useToast();
  const { user, loading: authLoading, openLoginModal } = useAuth();

  // --------------------------------------------------
  // FORM STATE
  // --------------------------------------------------

  const [itemId, setItemId] = useState('');
  // Set only when the farmer typed an animal type that isn't in the
  // catalog - itemId stays '' in that case, same fallback pattern as
  // the crop listing form's customItemName.
  const [customAnimalType, setCustomAnimalType] = useState('');
  const [title, setTitle] = useState('');
  // How many animals this one listing covers - always priced per
  // animal (see priceLabel), never a single blended total for the
  // group, so a buyer never has to guess whether the price they see
  // is for one animal or the whole lot.
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);

  const [locationParts, setLocationParts] = useState({
    village: user?.village || '',
    area: '',
    taluk: user?.taluk || '',
    district: user?.district || '',
    state: user?.state || KARNATAKA,
  });

  const [coords, setCoords] = useState(
    user?.lat != null && user?.lng != null
      ? { lat: user.lat, lng: user.lng, accuracy: null }
      : null
  );

  // --------------------------------------------------
  // UI STATE
  // --------------------------------------------------

  const [loadingListing, setLoadingListing] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState('');

  // --------------------------------------------------
  // VALIDATION STATE
  // --------------------------------------------------

  const [itemError, setItemError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [priceError, setPriceError] = useState('');

  // --------------------------------------------------
  // SELECTED ANIMAL
  // --------------------------------------------------

  const selectedItem = useMemo(
    () => animalCatalog.find((animal) => animal.id === itemId),
    [itemId]
  );

  function animalOptionLabel(animal) {
    return `${animal.icon} ${animal.name} / ${animal.kannadaName}`;
  }

  // A farmer with an animal type outside the catalog can still list it -
  // typing a value that doesn't match any catalog animal is treated as
  // that type's name directly, with no itemId (so it won't carry a
  // catalog defaultUnit or be matched by AgroAI's catalog search).
  function handleAnimalChange(newValue) {
    const matched = animalCatalog.find(
      (a) => animalOptionLabel(a) === newValue
    );
    if (matched) {
      setItemId(matched.id);
      setCustomAnimalType('');
    } else {
      setItemId('');
      setCustomAnimalType(newValue);
    }
  }

  // --------------------------------------------------
  // BACK
  // --------------------------------------------------

  function handleBack() {
    const hasUnsavedChanges =
      itemId.trim() !== '' ||
      customAnimalType.trim() !== '' ||
      title.trim() !== '' ||
      quantity.trim() !== '1' ||
      price.trim() !== '' ||
      description.trim() !== '' ||
      photos.length > 0;

    if (
      hasUnsavedChanges &&
      !window.confirm(
        t('listings:create.unsavedChangesWarning')
      )
    ) {
      return;
    }

    navigate('/sell-animal/dashboard');
  }

  // --------------------------------------------------
  // INITIAL LOCATION / EDIT LISTING
  // --------------------------------------------------

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      openLoginModal();
      navigate('/', { replace: true });
      return;
    }

    // New listing
    if (!editId) {
      setLoadingListing(false);

      setLocationParts({
        village: user.village || '',
        area: '',
        taluk: user.taluk || '',
        district: user.district || '',
        state: user.state || KARNATAKA,
      });

      return;
    }

    // Editing existing listing
    let cancelled = false;

    async function loadListing() {
      setLoadingListing(true);

      try {
        const existing = await getListingById(editId);

        if (cancelled) return;

        if (!existing) {
          showToast(
            t('animals:create.listingNotFound', {
              defaultValue: 'Listing not found.',
            })
          );

          navigate('/sell-animal/listings', {
            replace: true,
          });

          return;
        }

        if (existing.itemId) {
          setItemId(existing.itemId);
          setCustomAnimalType('');
        } else {
          setItemId('');
          setCustomAnimalType('');
        }

        setTitle(existing.itemName || '');

        setQuantity(
          existing.quantity != null
            ? String(existing.quantity)
            : '1'
        );

        setPrice(
          existing.price != null
            ? String(existing.price)
            : ''
        );

        setDescription(existing.description || '');

        setPhotos(existing.photoUrls || []);

        setLocationParts({
          village:
            existing.locationVillage ||
            user.village ||
            '',

          area: existing.locationArea || '',

          taluk:
            existing.locationTaluk ||
            user.taluk ||
            '',

          district:
            existing.locationDistrict ||
            user.district ||
            '',

          state:
            existing.locationState ||
            user.state ||
            KARNATAKA,
        });

        if (
          existing.lat != null &&
          existing.lng != null
        ) {
          setCoords({
            lat: existing.lat,
            lng: existing.lng,
          });
        } else {
          setCoords(null);
        }
      } catch {
        if (cancelled) return;

        showToast(
          t('animals:create.loadFailed', {
            defaultValue:
              'Unable to load the listing.',
          })
        );

        navigate('/sell-animal/listings', {
          replace: true,
        });
      } finally {
        if (!cancelled) {
          setLoadingListing(false);
        }
      }
    }

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [
    editId,
    user,
    authLoading,
    navigate,
    openLoginModal,
    showToast,
    t,
  ]);

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  function resetForm() {
    setItemId('');
    setCustomAnimalType('');
    setTitle('');
    setQuantity('1');
    setPrice('');
    setDescription('');
    setPhotos([]);

    setItemError('');
    setPhotoError('');
    setTitleError('');
    setQuantityError('');
    setPriceError('');

    setCoords(null);

    setLocationParts({
      village: user?.village || '',
      area: '',
      taluk: user?.taluk || '',
      district: user?.district || '',
      state: user?.state || KARNATAKA,
    });
  }

  // --------------------------------------------------
  // CLEAR VALIDATION ERRORS
  // --------------------------------------------------

  function clearErrors() {
    setItemError('');
    setPhotoError('');
    setTitleError('');
    setQuantityError('');
    setPriceError('');
  }

  // --------------------------------------------------
  // VALIDATE FOR PUBLISH
  // --------------------------------------------------

  function validateForPublish() {
    let valid = true;

    if (!itemId && !customAnimalType.trim()) {
      setItemError(
        t('animals:create.validationCategory')
      );
      valid = false;
    } else {
      setItemError('');
    }

    if (photos.length === 0) {
      setPhotoError(
        t('animals:create.validationPhoto')
      );
      valid = false;
    } else {
      setPhotoError('');
    }

    if (!title.trim()) {
      setTitleError(
        t('animals:create.validationTitle')
      );
      valid = false;
    } else {
      setTitleError('');
    }

    const numericQuantity = Number(quantity);

    if (
      !quantity ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity <= 0 ||
      numericQuantity > 100
    ) {
      setQuantityError(
        t('animals:create.validationQuantity')
      );
      valid = false;
    } else {
      setQuantityError('');
    }

    const numericPrice = Number(price);

    if (
      !price ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setPriceError(
        t('animals:create.validationPrice')
      );
      valid = false;
    } else {
      setPriceError('');
    }

    return valid;
  }

  // --------------------------------------------------
  // SAVE LISTING
  // --------------------------------------------------

  async function handleSave(status) {
    if (saving) return;

    if (!user) {
      showToast(
        t('common:loginRequired', {
          defaultValue:
            'Please login to continue.',
        })
      );
      return;
    }

    /*
     * Draft:
     * Do not require all publish fields.
     *
     * We only need enough information to create/update
     * a useful draft.
     */
    if (status === 'draft') {
      clearErrors();

      if (!itemId && !customAnimalType.trim() && !title.trim()) {
        setItemError(
          t('animals:create.validationCategory')
        );

        showToast(
          t('animals:create.validationCategory')
        );

        return;
      }
    }

    /*
     * Published listing:
     * All required fields must be valid.
     */
    if (status === 'published') {
      if (!validateForPublish()) {
        return;
      }
    }

    setSaving(true);

    try {
      const numericPrice = Number(price);

      const location = [
        locationParts.village,
        locationParts.area,
        locationParts.taluk,
        locationParts.district,
      ]
        .filter(Boolean)
        .join(', ');

      const payload = {
        ownerId: user.id,
        ownerType: 'farmer',

        category: CATEGORY,

        itemId: itemId || null,

        itemName:
          title.trim() ||
          selectedItem?.name ||
          customAnimalType.trim() ||
          '',

        // Always priced per animal (see priceLabel) - quantity is how
        // many the listing covers, never a multiplier baked into price.
        quantity:
          Number.isInteger(Number(quantity)) && Number(quantity) > 0
            ? Number(quantity)
            : 1,

        unit:
          selectedItem?.defaultUnit ||
          'Head',

        price:
          Number.isFinite(numericPrice) &&
          numericPrice > 0
            ? numericPrice
            : 0,

        description:
          description.trim(),

        photoUrls: photos,

        location,

        locationVillage:
          locationParts.village || '',

        locationArea:
          locationParts.area || '',

        locationTaluk:
          locationParts.taluk || '',

        locationDistrict:
          locationParts.district || '',

        locationState:
          locationParts.state || '',

        lat:
          coords?.lat ?? null,

        lng:
          coords?.lng ?? null,

        phone: user.phone || '',

        status,
      };

      const listing = editId
        ? await updateListing(editId, payload)
        : await createListing(payload);

      // ----------------------------------------------
      // DRAFT
      // ----------------------------------------------

      if (status === 'draft') {
        showToast(
          t('animals:create.draftSaved')
        );

        navigate('/sell-animal/listings');

        return;
      }

      // ----------------------------------------------
      // PUBLISHED
      // ----------------------------------------------

      setPublishedTitle(
        listing?.itemName ||
          title.trim() ||
          selectedItem?.name ||
          customAnimalType.trim() ||
          ''
      );

      setSuccessOpen(true);
    } catch {
      showToast(
        t('animals:create.saveFailed', {
          defaultValue:
            'Unable to save the listing. Please try again.',
        })
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (authLoading || loadingListing) {
    return (
      <AppShell
        title={t('navigation:animals.sellAnimal')}
        onBack={handleBack}
      >
        <div
          style={{
            padding: 16,
            color: 'var(--muted)',
          }}
        >
          {t('common:loading')}
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return null;
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AppShell
      title={t('navigation:animals.sellAnimal')}
      onBack={handleBack}
    >
      <div className="create-listing-page">

        <p className="create-listing-subtitle">
          {t('animals:create.subtitle')}
        </p>

        {/* ==========================================
            STEP 1 — ANIMAL DETAILS
        ========================================== */}

        <StepCard
          number={1}
          title={t(
            'animals:create.step1Title'
          )}
        >
          {/* Animal Type */}

          <div
            className={`cl-field${
              itemError ? ' has-error' : ''
            }`}
          >
            <label>
              {t(
                'animals:create.animalType'
              )}{' '}
              *
            </label>

            <LocationSuggestInput
              value={
                selectedItem
                  ? animalOptionLabel(selectedItem)
                  : customAnimalType
              }
              options={animalCatalog.map(animalOptionLabel)}
              onChange={(newValue) => {
                handleAnimalChange(newValue);
                setItemError('');
              }}
              placeholder={t(
                'animals:create.animalType'
              )}
              label={t(
                'animals:create.animalType'
              )}
            />

            {itemError && (
              <span className="cl-field-error">
                {itemError}
              </span>
            )}
          </div>

          {/* Title */}

          <div
            className={`cl-field${
              titleError ? ' has-error' : ''
            }`}
          >
            <label>
              {t(
                'animals:create.titleLabel'
              )}{' '}
              *
            </label>

            <input
              type="text"
              maxLength={60}
              placeholder={t(
                'animals:create.titlePlaceholder'
              )}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError('');
              }}
            />

            {titleError && (
              <span className="cl-field-error">
                {titleError}
              </span>
            )}
          </div>

          {/* Quantity */}

          <div
            className={`cl-field${
              quantityError ? ' has-error' : ''
            }`}
          >
            <label>
              {t(
                'animals:create.quantity'
              )}{' '}
              *
            </label>

            <input
              type="number"
              min="1"
              max="100"
              step="1"
              inputMode="numeric"
              placeholder={t(
                'animals:create.quantityPlaceholder'
              )}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setQuantityError('');
              }}
            />

            {quantityError && (
              <span className="cl-field-error">
                {quantityError}
              </span>
            )}
          </div>

          {/* Price */}

          <div
            className={`cl-field${
              priceError ? ' has-error' : ''
            }`}
          >
            <label>
              {t(
                'animals:create.priceLabel'
              )}{' '}
              *
            </label>

            <div className="cl-price-input">
              <span>₹</span>

              <input
                type="number"
                min="1"
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPriceError('');
                }}
              />
            </div>

            {priceError && (
              <span className="cl-field-error">
                {priceError}
              </span>
            )}
          </div>

          {/* Description */}

          <div className="cl-field">
            <label>
              {t(
                'animals:create.description'
              )}
            </label>

            <textarea
              maxLength={200}
              placeholder={t(
                'animals:create.descriptionPlaceholder'
              )}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
            />

            <span className="cl-charcount">
              {description.length}/200
            </span>
          </div>

          {/* Photo */}

          <div
            className={`cl-field${
              photoError ? ' has-error' : ''
            }`}
          >
            <label>
              {t(
                'animals:create.uploadImage'
              )}{' '}
              *
            </label>

            <MultiPhotoUpload
              values={photos}
              onChange={(next) => {
                setPhotos(next);
                setPhotoError('');
              }}
              max={4}
              title={t(
                'animals:create.uploadPhotoTitle'
              )}
              label={t(
                'animals:create.uploadLabel'
              )}
              hint={t(
                'animals:create.uploadHint'
              )}
            />

            {photoError && (
              <span className="cl-field-error">
                {photoError}
              </span>
            )}
          </div>
        </StepCard>

        {/* ==========================================
            STEP 2 — LOCATION
        ========================================== */}

        <StepCard
          number={2}
          title={t(
            'animals:create.step2Title'
          )}
        >
          <GpsLocationSection
            locationParts={locationParts}
            onLocationPartsChange={
              setLocationParts
            }
            coords={coords}
            onCoordsChange={setCoords}
          />
        </StepCard>

        {/* ==========================================
            STICKY ACTION BAR
        ========================================== */}

        <div className="cl-sticky-bar">
          <StickyActionBar
            secondaryLabel={t(
              'animals:create.saveDraft'
            )}
            onSecondary={() =>
              handleSave('draft')
            }
            primaryLabel={t(
              'animals:create.publishListing'
            )}
            onPrimary={() =>
              handleSave('published')
            }
            primaryLoading={saving}
          />
        </div>

        {/* ==========================================
            SUCCESS SHEET
        ========================================== */}

        <BottomSheet
          open={successOpen}
          onClose={() =>
            setSuccessOpen(false)
          }
        >
          <div className="cl-success-icon">
            ✅
          </div>

          <h3 className="cl-success-title">
            {t(
              'animals:create.successTitle'
            )}
          </h3>

          <p className="cl-success-body">
            {t(
              'animals:create.successBody',
              {
                item: publishedTitle,
              }
            )}
          </p>

          <div className="cl-success-actions">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={() => {
                setSuccessOpen(false);
                resetForm();
              }}
            >
              {t(
                'animals:create.addAnother'
              )}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={() => {
                setSuccessOpen(false);

                navigate(
                  '/sell-animal/listings'
                );
              }}
            >
              {t(
                'animals:create.viewListing'
              )}
            </button>
          </div>
        </BottomSheet>
      </div>
    </AppShell>
  );
}