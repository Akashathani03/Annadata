import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  createListing,
  getListingById,
  updateListing,
} from '../../../services/listingsService';

import { equipmentCatalog } from '../../../config/equipmentCatalog';
import { KARNATAKA } from '../../../data/karnatakaLocations';

import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

import AppShell from '../../../components/common/AppShell';
import StepCard from '../../../components/common/StepCard';
import MultiPhotoUpload from '../../../components/common/MultiPhotoUpload';
import GpsLocationSection from '../../../components/common/GpsLocationSection';
import StickyActionBar from '../../../components/common/StickyActionBar';
import BottomSheet from '../../../components/common/BottomSheet';

import '../../Crops/SellCrop/CreateListing.css';


const CATEGORY = 'equipment';

const CONDITIONS = [
  'new',
  'used-good',
  'used-fair',
];


export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get('edit');

  const { t } = useTranslation([
    'equipment',
    'listings',
    'common',
    'navigation',
  ]);

  const { showToast } = useToast();
  const { user } = useAuth();


  // -----------------------------
  // Form state
  // -----------------------------

  const [itemId, setItemId] = useState('');
  const [title, setTitle] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);

  const [locationParts, setLocationParts] = useState({
    village: user?.village || '',
    taluk: user?.taluk || '',
    district: user?.district || '',
    state: user?.state || KARNATAKA,
  });

  const [coords, setCoords] = useState(
    user?.lat != null && user?.lng != null
      ? { lat: user.lat, lng: user.lng, accuracy: null }
      : null
  );


  // -----------------------------
  // UI state
  // -----------------------------

  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [publishedTitle, setPublishedTitle] = useState('');


  // -----------------------------
  // Validation state
  // -----------------------------

  const [itemError, setItemError] = useState('');
  const [conditionError, setConditionError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [priceError, setPriceError] = useState('');


  // -----------------------------
  // Load user location / edit data
  // -----------------------------

  useEffect(() => {
    let cancelled = false;


    async function loadData() {
      if (!editId) {
        setLocationParts({
          village: user?.village || '',
          taluk: user?.taluk || '',
          district: user?.district || '',
          state: user?.state || KARNATAKA,
        });

        return;
      }


      setLoadingEdit(true);

      try {
        const existing = await getListingById(editId);

        if (cancelled) return;

        if (!existing) {
          showToast(
            t(
              'equipment:loadFailed',
              'Listing could not be loaded.'
            )
          );

          navigate('/sell-equipment/listings', {
            replace: true,
          });

          return;
        }


        setItemId(existing.itemId || '');

        setTitle(existing.itemName || '');

        setCondition(existing.condition || '');

        setPrice(
          existing.price != null
            ? String(existing.price)
            : ''
        );

        setDescription(
          existing.description || ''
        );

        setPhotos(
          existing.photoUrls || []
        );


        setLocationParts({
          village:
            existing.locationVillage ||
            user?.village ||
            '',

          taluk:
            existing.locationTaluk ||
            user?.taluk ||
            '',

          district:
            existing.locationDistrict ||
            user?.district ||
            '',

          state:
            existing.locationState ||
            user?.state ||
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
        }
      } catch {
        if (!cancelled) {
          showToast(
            t(
              'equipment:loadFailed',
              'Something went wrong loading this form.'
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEdit(false);
        }
      }
    }


    loadData();


    return () => {
      cancelled = true;
    };
  }, [editId, user, navigate, showToast, t]);


  // -----------------------------
  // Back button
  // -----------------------------

  function handleBack() {
    const hasUnsavedChanges =
      itemId.trim() !== '' ||
      title.trim() !== '' ||
      condition.trim() !== '' ||
      price.trim() !== '' ||
      description.trim() !== '' ||
      photos.length > 0;


    if (
      hasUnsavedChanges &&
      !window.confirm(
        t(
          'listings:create.unsavedChangesWarning'
        )
      )
    ) {
      return;
    }


    navigate('/sell-equipment/dashboard');
  }


  // -----------------------------
  // Reset form
  // -----------------------------

  function resetForm() {
    setItemId('');
    setTitle('');
    setCondition('');
    setPrice('');
    setDescription('');
    setPhotos([]);

    setLocationParts({
      village: user?.village || '',
      taluk: user?.taluk || '',
      district: user?.district || '',
      state: user?.state || KARNATAKA,
    });

    setCoords(null);

    setItemError('');
    setConditionError('');
    setPhotoError('');
    setTitleError('');
    setPriceError('');
  }


  // -----------------------------
  // Validation
  // -----------------------------

  function validate() {
    let valid = true;


    // Equipment type
    if (!itemId) {
      setItemError(
        t(
          'equipment:create.validationCategory'
        )
      );

      valid = false;
    } else {
      setItemError('');
    }


    // Condition
    if (!condition) {
      setConditionError(
        t(
          'equipment:create.validationCondition'
        )
      );

      valid = false;
    } else {
      setConditionError('');
    }


    // Photo
    if (photos.length === 0) {
      setPhotoError(
        t(
          'equipment:create.validationPhoto'
        )
      );

      valid = false;
    } else {
      setPhotoError('');
    }


    // Title
    if (!title.trim()) {
      setTitleError(
        t(
          'equipment:create.validationTitle'
        )
      );

      valid = false;
    } else {
      setTitleError('');
    }


    // Price
    const numericPrice = Number(price);

    if (
      !price ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setPriceError(
        t(
          'equipment:create.validationPrice'
        )
      );

      valid = false;
    } else {
      setPriceError('');
    }


    return valid;
  }


  // -----------------------------
  // Save listing
  // -----------------------------

  async function handleSave(status) {
    if (saving) return;

    if (!validate()) return;

    if (!user?.id) {
      showToast(
        t(
          'common:loginRequired',
          'Please login to continue.'
        )
      );

      return;
    }


    setSaving(true);


    const location =
      [
        locationParts.village,
        locationParts.taluk,
        locationParts.district,
      ]
        .filter(Boolean)
        .join(', ');


    const payload = {
      ownerId: user.id,
      ownerType: 'farmer',

      category: CATEGORY,

      itemId,

      itemName: title.trim(),

      // Backend-safe defaults.
      quantity: 1,
      unit: 'Unit',

      price: Number(price),

      description:
        description.trim(),

      photoUrls: photos,

      condition,

      location,

      locationVillage:
        locationParts.village,

      locationTaluk:
        locationParts.taluk,

      locationDistrict:
        locationParts.district,

      locationState:
        locationParts.state,

      lat:
        coords?.lat ?? null,

      lng:
        coords?.lng ?? null,

      phone:
        user?.phone || '',

      status,
    };


    try {
      let listing;


      if (editId) {
        listing = await updateListing(
          editId,
          payload
        );
      } else {
        listing = await createListing(
          payload
        );
      }


      if (!listing) {
        throw new Error(
          'Listing was not returned by the server.'
        );
      }


      // Draft
      if (status === 'draft') {
        showToast(
          t(
            'equipment:create.draftSaved'
          )
        );

        navigate('/sell-equipment/listings');

        return;
      }


      // Published
      setPublishedTitle(
        listing.itemName ||
        title.trim()
      );

      setSuccessOpen(true);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[Equipment CreateListing]',
          error
        );
      }

      showToast(
        t(
          'equipment:saveFailed',
          'Could not save the listing. Please try again.'
        )
      );
    } finally {
      setSaving(false);
    }
  }


  // -----------------------------
  // Loading edit listing
  // -----------------------------

  if (loadingEdit) {
    return (
      <AppShell
        title={t(
          'navigation:equipment.sellEquipment'
        )}
        onBack={() =>
          navigate(
            '/sell-equipment/dashboard'
          )
        }
      >
        <div className="create-listing-page">
          <p
            style={{
              padding: 16,
              color: 'var(--muted)',
            }}
          >
            {t(
              'common:loading',
              'Loading...'
            )}
          </p>
        </div>
      </AppShell>
    );
  }


  // -----------------------------
  // UI
  // -----------------------------

  return (
    <AppShell
      title={t(
        'navigation:equipment.sellEquipment'
      )}
      onBack={handleBack}
    >
      <div className="create-listing-page">

        {/* Subtitle */}
        <p className="create-listing-subtitle">
          {t(
            'equipment:create.subtitle'
          )}
        </p>


        {/* STEP 1 */}
        <StepCard
          number={1}
          title={t(
            'equipment:create.step1Title'
          )}
        >

          {/* Equipment Type */}
          <div
            className={`cl-field${
              itemError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t(
                'equipment:create.equipmentType'
              )}{' '}
              *
            </label>

            <select
              value={itemId}
              onChange={(e) => {
                setItemId(
                  e.target.value
                );

                setItemError('');
              }}
            >
              <option value="">
                {t(
                  'equipment:create.equipmentType'
                )}
              </option>

              {equipmentCatalog.map(
                (equipment) => (
                  <option
                    key={equipment.id}
                    value={equipment.id}
                  >
                    {equipment.icon}{' '}
                    {equipment.name}
                    {equipment.kannadaName
                      ? ` / ${equipment.kannadaName}`
                      : ''}
                  </option>
                )
              )}
            </select>

            {itemError && (
              <span className="cl-field-error">
                {itemError}
              </span>
            )}
          </div>


          {/* Title */}
          <div
            className={`cl-field${
              titleError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t(
                'equipment:create.titleLabel'
              )}{' '}
              *
            </label>

            <input
              type="text"
              maxLength={60}
              placeholder={t(
                'equipment:create.titlePlaceholder'
              )}
              value={title}
              onChange={(e) => {
                setTitle(
                  e.target.value
                );

                setTitleError('');
              }}
            />

            {titleError && (
              <span className="cl-field-error">
                {titleError}
              </span>
            )}
          </div>


          {/* Condition */}
          <div
            className={`cl-field${
              conditionError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t(
                'equipment:create.conditionLabel'
              )}{' '}
              *
            </label>

            <select
              value={condition}
              onChange={(e) => {
                setCondition(
                  e.target.value
                );

                setConditionError('');
              }}
            >
              <option value="">
                {t(
                  'equipment:create.conditionLabel'
                )}
              </option>

              {CONDITIONS.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {t(
                      `equipment:condition.${value}`
                    )}
                  </option>
                )
              )}
            </select>

            {conditionError && (
              <span className="cl-field-error">
                {conditionError}
              </span>
            )}
          </div>


          {/* Price */}
          <div
            className={`cl-field${
              priceError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t(
                'equipment:create.priceLabel'
              )}{' '}
              *
            </label>

            <div className="cl-price-input">
              <span>₹</span>

              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={price}
                onChange={(e) => {
                  setPrice(
                    e.target.value
                  );

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
                'equipment:create.description'
              )}
            </label>

            <textarea
              maxLength={200}
              placeholder={t(
                'equipment:create.descriptionPlaceholder'
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
              photoError
                ? ' has-error'
                : ''
            }`}
          >
            <label>
              {t(
                'equipment:create.uploadImage'
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
              label={t(
                'equipment:create.uploadLabel'
              )}
              hint={t(
                'equipment:create.uploadHint'
              )}
            />

            {photoError && (
              <span className="cl-field-error">
                {photoError}
              </span>
            )}
          </div>

        </StepCard>


        {/* STEP 2 */}
        <StepCard
          number={2}
          title={t(
            'equipment:create.step2Title'
          )}
        >
          <GpsLocationSection
            locationParts={
              locationParts
            }
            onLocationPartsChange={
              setLocationParts
            }
            coords={coords}
            onCoordsChange={
              setCoords
            }
          />
        </StepCard>


        {/* Bottom spacing */}
        <div
          style={{
            height: 80,
          }}
        />


        {/* Sticky actions */}
        <div className="cl-sticky-bar">
          <StickyActionBar
            secondaryLabel={t(
              'equipment:create.saveDraft'
            )}
            onSecondary={() =>
              handleSave('draft')
            }
            primaryLabel={t(
              'equipment:create.publishListing'
            )}
            onPrimary={() =>
              handleSave('published')
            }
            primaryLoading={saving}
          />
        </div>


        {/* Success Sheet */}
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
              'equipment:create.successTitle'
            )}
          </h3>

          <p className="cl-success-body">
            {t(
              'equipment:create.successBody',
              {
                item: publishedTitle,
              }
            )}
          </p>

          <div className="cl-success-actions">

            {/* Add another */}
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={() => {
                setSuccessOpen(false);
                resetForm();
              }}
            >
              {t(
                'equipment:create.addAnother'
              )}
            </button>


            {/* View listing */}
            <button
              type="button"
              className="sticky-bar-primary"
              onClick={() => {
                setSuccessOpen(false);

                navigate(
                  '/sell-equipment/listings'
                );
              }}
            >
              {t(
                'equipment:create.viewListing'
              )}
            </button>

          </div>
        </BottomSheet>

      </div>
    </AppShell>
  );
}