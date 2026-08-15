import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getCropCatalog,
  getApmcMarkets,
  getCropPriceDetail,
} from '../../../services/marketPricesService';
import {
  createListing,
  getListingById,
  updateListing,
} from '../../../services/listingsService';
import { distanceKm, findNearest } from '../../../utils/geo';
import {
  getListingFieldConfig,
  unitMeta,
} from '../../../config/listingFieldConfig';
import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';
import { useToast } from '../../../context/ToastContext';
import AppShell from '../../../components/common/AppShell';
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

  const { t } = useTranslation([
    'listings',
    'marketPrices',
    'common',
  ]);

  const { showToast } = useToast();
  const { user } = useAuth();

  const {
    lat: currentLat,
    lng: currentLng,
  } = useUserLocation();

  const config = getListingFieldConfig(CATEGORY);

  const [catalog, setCatalog] = useState([]);
  const [apmcs, setApmcs] = useState([]);

  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(
    config.defaultQuantity
  );
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [priceTouched, setPriceTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');

  const [apmcId, setApmcId] = useState('');

  const [locationParts, setLocationParts] = useState({
    village: '',
    taluk: '',
    district: '',
    state: '',
  });

  const [coords, setCoords] = useState(null);

  const [apmcManuallySelected, setApmcManuallySelected] =
    useState(false);

  const [marketPrice, setMarketPrice] = useState(null);

  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [publishedItemName, setPublishedItemName] = useState('');

  const [quantityError, setQuantityError] = useState('');
  const [priceError, setPriceError] = useState('');

  function handleBack() {
    const hasUnsavedChanges =
      price.trim() !== '' ||
      description.trim() !== '' ||
      photo !== '';

    if (
      hasUnsavedChanges &&
      !window.confirm(
        t('listings:create.unsavedChangesWarning')
      )
    ) {
      return;
    }

    navigate('/sell/dashboard');
  }

  /*
   * Load crop catalog, APMC markets and existing listing.
   *
   * The requests are intentionally handled separately so that a failure
   * in one secondary request doesn't unnecessarily prevent the other
   * data from being used.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const cropList = await getCropCatalog();

        if (cancelled) return;

        setCatalog(cropList);

        if (!editId && cropList.length) {
          setItemId(cropList[0].id);
        }
      } catch {
        if (cancelled) return;

        showToast(t('listings:loadFailed'));
      }
    }

    async function loadApmcs() {
      try {
        const apmcList = await getApmcMarkets({
          lat: currentLat,
          lng: currentLng,
        });

        if (cancelled) return;

        setApmcs(apmcList);

        /*
         * For a new listing, initially select the nearest APMC.
         *
         * For an edit listing, the existing listing's APMC is restored
         * separately below, so don't overwrite it here.
         */
        if (!editId) {
          const nearest =
            apmcList.find((a) => a.isNearest) ??
            apmcList[0];

          if (nearest) {
            setApmcId(nearest.id);
          }
        }
      } catch {
        if (cancelled) return;

        setApmcs([]);
        showToast(t('listings:loadFailed'));
      }
    }

    async function loadExistingListing() {
      if (!editId) {
        setLocationParts({
          village: user?.village || '',
          taluk: user?.taluk || '',
          district: user?.district || '',
          state: user?.state || '',
        });

        return;
      }

      try {
        const existingListing =
          await getListingById(editId);

        if (cancelled || !existingListing) return;

        setItemId(existingListing.itemId);
        setQuantity(existingListing.quantity);
        setUnit(existingListing.unit);
        setPrice(String(existingListing.price));
        setPriceTouched(true);
        setDescription(existingListing.description || '');
        setPhoto(existingListing.photoUrl || '');
        setApmcId(existingListing.apmcId);

        setLocationParts({
          village:
            existingListing.locationVillage ||
            user?.village ||
            '',
          taluk:
            existingListing.locationTaluk ||
            user?.taluk ||
            '',
          district:
            existingListing.locationDistrict ||
            user?.district ||
            '',
          state:
            existingListing.locationState ||
            user?.state ||
            '',
        });

        /*
         * The existing listing's APMC is an intentional saved choice.
         * Keep it until the farmer explicitly uses a new GPS location.
         */
        setApmcManuallySelected(true);

        if (
          existingListing.lat != null &&
          existingListing.lng != null
        ) {
          setCoords({
            lat: existingListing.lat,
            lng: existingListing.lng,
          });
        }
      } catch {
        if (cancelled) return;

        showToast(t('listings:loadFailed'));
      }
    }

    loadCatalog();
    loadApmcs();
    loadExistingListing();

    return () => {
      cancelled = true;
    };
  }, [
    editId,
    user,
    currentLat,
    currentLng,
    showToast,
    t,
  ]);

  const selectedItem = useMemo(
    () => catalog.find((c) => c.id === itemId),
    [catalog, itemId]
  );

  const selectedApmc = useMemo(
    () => apmcs.find((a) => a.id === apmcId),
    [apmcs, apmcId]
  );

  useEffect(() => {
    if (selectedItem && !unit) {
      setUnit(selectedItem.defaultUnit);
    }
  }, [selectedItem, unit]);

  /*
   * Keep APMC selection aligned with the farmer's latest GPS location.
   *
   * Manual selection is respected until the farmer actually captures
   * a new location through GpsLocationSection.
   */
  useEffect(() => {
    if (
      !coords ||
      apmcManuallySelected ||
      apmcs.length === 0
    ) {
      return;
    }

    const nearest = findNearest(
      coords.lat,
      coords.lng,
      apmcs
    );

    if (nearest) {
      setApmcId(nearest.item.id);
    }
  }, [coords, apmcs, apmcManuallySelected]);

  /*
   * Load today's market price whenever crop or APMC changes.
   *
   * Clear the previous price first so stale data is never displayed
   * while the new request is being made.
   */
  useEffect(() => {
    let cancelled = false;

    if (!itemId || !apmcId) {
      setMarketPrice(null);
      return;
    }

    setMarketPrice(null);

    getCropPriceDetail(apmcId, itemId)
      .then((detail) => {
        if (cancelled) return;

        setMarketPrice(detail);

        if (detail && !priceTouched) {
          setPrice(String(detail.modalPrice));
        }
      })
      .catch(() => {
        if (cancelled) return;

        setMarketPrice(null);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, apmcId, priceTouched]);

  function handleLocationPartsChange(next) {
    setLocationParts(next);
  }

  /*
   * This wrapper is important:
   *
   * When the farmer uses GPS, the manually-selected APMC flag is
   * cleared. This allows the nearest APMC to be recalculated from the
   * new coordinates.
   */
  function handleCoordsChange(nextCoords) {
    setCoords(nextCoords);
    setApmcManuallySelected(false);
  }

  function handleApmcChange(nextApmcId) {
    setApmcId(nextApmcId);
    setApmcManuallySelected(true);
  }

  function resetForm() {
    setItemId(catalog[0]?.id ?? '');
    setQuantity(config.defaultQuantity);
    setUnit(catalog[0]?.defaultUnit ?? '');
    setPrice('');
    setPriceTouched(false);
    setDescription('');
    setPhoto('');
    setQuantityError('');
    setPriceError('');

    const nearestApmc =
      apmcs.find((a) => a.isNearest) ??
      apmcs[0];

    setApmcId(nearestApmc?.id ?? '');
    setApmcManuallySelected(false);
    setMarketPrice(null);
  }

  function validate() {
    let valid = true;

    if (!quantity || Number(quantity) <= 0) {
      setQuantityError(
        t('listings:create.validationQuantity')
      );
      valid = false;
    } else {
      setQuantityError('');
    }

    if (!price || Number(price) <= 0) {
      setPriceError(
        t('listings:create.validationPrice')
      );
      valid = false;
    } else {
      setPriceError('');
    }

    return valid;
  }

  async function handleSave(status) {
    if (saving) return;

    if (!validate()) return;

    if (!user?.id) {
      showToast(t('listings:loadFailed'));
      return;
    }

    setSaving(true);

    try {
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

        location: [
          locationParts.village,
          locationParts.taluk,
          locationParts.district,
        ]
          .filter(Boolean)
          .join(', '),

        locationVillage: locationParts.village,
        locationTaluk: locationParts.taluk,
        locationDistrict: locationParts.district,
        locationState: locationParts.state,

        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,

        phone: user?.phone,
        status,
      };

      const listing = editId
        ? await updateListing(editId, payload)
        : await createListing(payload);

      if (status === 'draft') {
        showToast(
          t('listings:create.draftSaved')
        );

        navigate('/sell/listings');
        return;
      }

      setPublishedItemName(
        listing?.itemName ||
          selectedItem?.name ||
          ''
      );

      setSuccessOpen(true);
    } catch {
      showToast(t('listings:loadFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title={t('navigation:crops.sellCrop')}
      onBack={handleBack}
    >
      <div className="create-listing-page">
        <p className="create-listing-subtitle">
          {t('listings:create.subtitle')}
        </p>

        <StepCard
          number={1}
          title={t('listings:create.step1Title')}
        >
          <div className="cl-field">
            <label>
              {t('listings:create.cropName')} *
            </label>

            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              {catalog.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.icon} {c.name} / {c.kannadaName}
                </option>
              ))}
            </select>
          </div>

          <div className="cl-row2">
            <div
              className={`cl-field${
                quantityError ? ' has-error' : ''
              }`}
            >
              <label>
                {t('listings:create.quantity')} *
              </label>

              <input
                type="number"
                min="1"
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

            <div className="cl-field">
              <label>
                {t('listings:create.unit')} *
              </label>

              <select
                value={unit}
                onChange={(e) =>
                  setUnit(e.target.value)
                }
              >
                <option value="">
                  {t('listings:create.selectUnit')}
                </option>

                {config.unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {unitMeta[u]?.icon}{' '}
                    {t(unitMeta[u]?.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`cl-field${
              priceError ? ' has-error' : ''
            }`}
          >
            <label>
              {t('listings:create.priceLabel', {
                unit:
                  unit ||
                  config.unitOptions[0],
              })}{' '}
              *
            </label>

            <div className="cl-price-input">
              <span>₹</span>

              <input
                type="number"
                min="1"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPriceTouched(true);
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

          <div className="cl-field">
            <label>
              {t('listings:create.description')}
            </label>

            <textarea
              maxLength={200}
              placeholder={t(
                'listings:create.descriptionPlaceholder'
              )}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />

            <span className="cl-charcount">
              {description.length}/200
            </span>
          </div>

          <div className="cl-field">
            <label>
              {t('listings:create.uploadImage')}
            </label>

            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              label={t(
                'listings:create.uploadLabel'
              )}
              hint={t(
                'listings:create.uploadHint'
              )}
            />
          </div>
        </StepCard>

        <StepCard
          number={2}
          title={t('listings:create.step2Title')}
        >
          <GpsLocationSection
            locationParts={locationParts}
            onLocationPartsChange={
              handleLocationPartsChange
            }
            coords={coords}
            onCoordsChange={handleCoordsChange}
          />

          <div className="cl-loc-box">
            <div className="lbl">
              {t('listings:create.apmcMarket')} ℹ️
            </div>

            <select
              className="cl-loc-select"
              value={apmcId}
              onChange={(e) =>
                handleApmcChange(e.target.value)
              }
            >
              {apmcs.map((a) => (
                <option
                  key={a.id}
                  value={a.id}
                >
                  {a.name}
                </option>
              ))}
            </select>

            {selectedApmc && (
              <div className="cl-dist">
                {(coords &&
                selectedApmc.location
                  ? distanceKm(
                      coords.lat,
                      coords.lng,
                      selectedApmc.location.lat,
                      selectedApmc.location.lng
                    )?.toFixed(1)
                  : selectedApmc.distanceKm)}{' '}
                km away
              </div>
            )}
          </div>

          <div className="cl-info-note">
            ℹ️{' '}
            {t('listings:create.apmcInfoNote')}
          </div>
        </StepCard>

        <StepCard
          number={3}
          title={t('listings:create.step3Title')}
        >
          <div className="cl-market-head">
            <div className="cl-market-head-left">
              <span className="icon">
                🏛️
              </span>

              <div>
                <b>{selectedApmc?.name}</b>
                <span>
                  {t(
                    'listings:create.todaysMarketPrice'
                  )}
                </span>
              </div>
            </div>

            <div className="cl-official-badge">
              <span className="dot">✓</span>

              <div>
                {t(
                  'listings:create.officialGovData'
                )}

                <small>
                  {t(
                    'listings:create.sourceLabel'
                  )}
                </small>
              </div>
            </div>
          </div>

          {marketPrice ? (
            <>
              <PriceGrid>
                <PriceBox
                  label={t(
                    'marketPrices:minimumPrice'
                  )}
                  value={marketPrice.minPrice}
                  unitLabel={t(
                    'marketPrices:perKg'
                  )}
                  tone="red"
                />

                <PriceBox
                  label={t(
                    'marketPrices:modalPrice'
                  )}
                  value={marketPrice.modalPrice}
                  unitLabel={t(
                    'marketPrices:perKg'
                  )}
                  tone="green"
                  highlight
                  tag={t(
                    'marketPrices:mostCommonPrice'
                  )}
                />

                <PriceBox
                  label={t(
                    'marketPrices:maximumPrice'
                  )}
                  value={marketPrice.maxPrice}
                  unitLabel={t(
                    'marketPrices:perKg'
                  )}
                  tone="orange"
                />
              </PriceGrid>

              <div className="cl-market-updated">
                🕐{' '}
                {t(
                  'listings:create.updatedToday',
                  {
                    time: new Date().toLocaleTimeString(
                      'en-IN',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    ),
                  }
                )}
              </div>
            </>
          ) : (
            <p className="cl-no-price">
              {t('marketPrices:notFound')}
            </p>
          )}
        </StepCard>

        <div style={{ height: 80 }} />

        <div className="cl-sticky-bar">
          <StickyActionBar
            secondaryLabel={t(
              'listings:create.saveDraft'
            )}
            onSecondary={() =>
              handleSave('draft')
            }
            primaryLabel={t(
              'listings:create.publishListing'
            )}
            onPrimary={() =>
              handleSave('published')
            }
            primaryLoading={saving}
          />
        </div>

        <BottomSheet
          open={successOpen}
          onClose={() => setSuccessOpen(false)}
        >
          <div className="cl-success-icon">
            ✅
          </div>

          <h3 className="cl-success-title">
            {t('listings:create.successTitle')}
          </h3>

          <p className="cl-success-body">
            {t(
              'listings:create.successBody',
              {
                item: publishedItemName,
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
                'listings:create.addAnother'
              )}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={() => {
                setSuccessOpen(false);
                navigate('/sell/listings');
              }}
            >
              {t(
                'listings:create.viewListing'
              )}
            </button>
          </div>
        </BottomSheet>
      </div>
    </AppShell>
  );
}