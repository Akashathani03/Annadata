import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getVillageSuggestions } from '../../services/geocodingService';
import { updateUserProfile } from '../../services/usersService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useGpsLocation } from '../../hooks/useGpsLocation';
import {
  KARNATAKA,
  KARNATAKA_DISTRICTS,
  getTaluksForDistrict,
} from '../../data/karnatakaLocations';
import BottomSheet from './BottomSheet';
import LocationSuggestInput from './LocationSuggestInput';
import './LocationCapture.css';

// Leaflet + react-leaflet is a real chunk of JS a farmer never needs
// unless they actually tap "Adjust on map" - lazy-loaded so it never
// costs anything on the common path (GPS fix accepted as-is).
const LocationPickerMap = lazy(() => import('./LocationPickerMap'));

// Accuracy above this (meters) is flagged as low-confidence in the
// confirm step - kept in sync with LocationCapture's own threshold.
const LOW_ACCURACY_THRESHOLD_M = 100;

const ERROR_MESSAGE_KEY = {
  'permission-denied': 'listings:create.gpsPermissionDenied',
  timeout: 'listings:create.gpsTimeout',
  unavailable: 'listings:create.gpsUnavailable',
  'position-unavailable': 'listings:create.gpsUnavailable',
};

export default function GpsLocationSection({
  locationParts,
  onLocationPartsChange,
  coords,
  onCoordsChange,
}) {
  const { t } = useTranslation(['listings', 'common']);
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();
  const {
    status,
    errorCode,
    coords: gpsCoords,
    address,
    capture,
  } = useGpsLocation();

  const [locationPermissionOpen, setLocationPermissionOpen] =
    useState(false);
  // A detected address is held here for the farmer to review, rather
  // than overwriting Village/Taluk/District/State the moment GPS
  // resolves - desktop/indoor fixes are often too coarse to trust
  // silently, and a wrong auto-fill is easy to miss until the listing
  // is already published.
  const [addressResolved, setAddressResolved] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  // Set when the farmer drags the pin on the map to a spot other than
  // the raw GPS fix - takes over from `gpsCoords`/`address` for
  // display and confirm, without touching the hook's own state.
  const [override, setOverride] = useState(null); // { lat, lng, address }

  const mountedRef = useRef(true);
  // Guards against re-running the "fix settled" effect below on every
  // intermediate accuracy update while watchPosition is still
  // converging - it should fire exactly once per capture.
  const settledRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /*
   * Save the latest GPS position to the user's profile.
   * This is intentionally a background operation.
   */
  async function persistLocationToProfile(lat, lng) {
    if (!user) return;

    try {
      await updateUserProfile(user.id, { lat, lng });

      if (mountedRef.current) {
        await refreshUser();
      }
    } catch {
      // Profile location persistence is not required for
      // the current listing, so failures stay silent.
    }
  }

  // Fires once the hook has settled on the fix it's going to use (it
  // has moved on to geocoding, or finished with no address) - not on
  // every intermediate position update while still converging on
  // accuracy.
  useEffect(() => {
    if (status !== 'geocoding' && status !== 'done') return;
    if (!gpsCoords || settledRef.current) return;
    settledRef.current = true;

    onCoordsChange({
      lat: gpsCoords.lat,
      lng: gpsCoords.lng,
      accuracy: gpsCoords.accuracy,
    });

    persistLocationToProfile(gpsCoords.lat, gpsCoords.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, gpsCoords]);

  useEffect(() => {
    if (status !== 'done') return;

    if (!address) {
      // GPS worked, but no useful address was found. Coordinates
      // (persisted above) are still valid.
      showToast(t('listings:create.gpsGeocodeError'));
    }
    // A resolved address is surfaced via the confirm card below
    // instead of being merged here - see handleConfirmAddress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, address]);

  useEffect(() => {
    if (status !== 'error') return;

    if (import.meta.env.DEV) {
      console.warn('[GpsLocationSection] GPS failed', { errorCode });
    }

    showToast(t(ERROR_MESSAGE_KEY[errorCode] || 'listings:create.gpsError'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, errorCode]);

  /*
   * Open our own permission explanation first.
   */
  function handleUseGpsClick() {
    if (status === 'capturing' || status === 'geocoding') {
      return;
    }

    setLocationPermissionOpen(true);
  }

  /*
   * User accepted our explanation.
   */
  function handleAllowLocation() {
    setLocationPermissionOpen(false);
    settledRef.current = false;
    setAddressResolved(false);
    setOverride(null);
    capture();
  }

  function handleConfirmAddress() {
    onLocationPartsChange((prev) => ({
      village: effectiveAddress.village || prev.village || '',
      taluk: effectiveAddress.taluk || prev.taluk || '',
      district: effectiveAddress.district || prev.district || '',
      state: effectiveAddress.state || prev.state || '',
    }));

    if (override) {
      onCoordsChange({ lat: override.lat, lng: override.lng, accuracy: null });
      persistLocationToProfile(override.lat, override.lng);
    }

    setAddressResolved(true);
    showToast(t('listings:create.gpsCaptured'));
  }

  function handleRetryAddress() {
    settledRef.current = false;
    setAddressResolved(false);
    setOverride(null);
    capture();
  }

  function handleDismissAddress() {
    setOverride(null);
    setAddressResolved(true);
  }

  function handleMapConfirm({ lat, lng, address: mapAddress }) {
    setOverride({ lat, lng, address: mapAddress || {} });
    setMapOpen(false);
  }

  const isGpsBusy = status === 'capturing' || status === 'geocoding';
  const confirmingAddress = status === 'done' && !!address && !addressResolved;
  const effectiveCoords = override
    ? { lat: override.lat, lng: override.lng, accuracy: null }
    : gpsCoords;
  const effectiveAddress = override ? override.address : address;

  return (
    <>
      <div className="cl-loc-card">

        <div className="cl-loc-title">
          📍 {t(
            'listings:create.currentLocationTitle'
          )}
        </div>

        <div className="cl-loc-row">
          <label>{t('listings:create.village')}</label>

          <LocationSuggestInput
            value={locationParts?.village}
            fetchOptions={() =>
              getVillageSuggestions({
                taluk: locationParts?.taluk,
                district: locationParts?.district,
                state: locationParts?.state || KARNATAKA,
              })
            }
            placeholder="—"
            label={t('listings:create.village')}
            onChange={(newValue) =>
              onLocationPartsChange((prev) => ({
                ...prev,
                village: newValue,
              }))
            }
          />
        </div>

        {[
          {
            field: 'taluk',
            options: getTaluksForDistrict(locationParts?.district),
          },
          { field: 'district', options: KARNATAKA_DISTRICTS },
          { field: 'state', options: [KARNATAKA] },
        ].map(({ field, options }) => {
          const fieldLabel = t(`listings:create.${field}`);

          return (
            <div
              className="cl-loc-row"
              key={field}
            >
              <label>{fieldLabel}</label>

              <LocationSuggestInput
                value={locationParts?.[field]}
                options={options}
                placeholder="—"
                label={fieldLabel}
                onChange={(newValue) =>
                  onLocationPartsChange(
                    (prev) => ({
                      ...prev,
                      [field]: newValue,
                    })
                  )
                }
              />
            </div>
          );
        })}

        <button
          type="button"
          className="cl-gps-btn"
          onClick={handleUseGpsClick}
          disabled={isGpsBusy}
        >
          📍{' '}
          {isGpsBusy
            ? t(
                'listings:create.gpsGettingLocation'
              )
            : t(
                'listings:create.useGps'
              )}
        </button>

        {status === 'capturing' && (
          <div className="cl-gps-status">
            {t(
              'listings:create.gpsCapturing'
            )}
          </div>
        )}

        {status === 'geocoding' && (
          <div className="cl-gps-status">
            {t(
              'listings:create.gpsGeocoding'
            )}
          </div>
        )}

        {status === 'done' && (address ? addressResolved : true) && (
          <div className="cl-gps-status">
            ✓{' '}
            {t(
              'listings:create.gpsCaptured'
            )}

            {coords?.accuracy != null && (
              <span>
                {' '}
                ·{' '}
                {Math.round(
                  coords.accuracy
                )}
                m
              </span>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="cl-gps-status cl-gps-error">
            {t(ERROR_MESSAGE_KEY[errorCode] || 'listings:create.gpsError')}
          </div>
        )}

        {confirmingAddress && (
          <div className="loc-confirm-card">
            <div className="loc-confirm-title">
              {t('common:confirmDetectedTitle')}
            </div>

            <div className="loc-confirm-address">
              {[
                effectiveAddress.village,
                effectiveAddress.taluk,
                effectiveAddress.district,
                effectiveAddress.state,
              ]
                .filter(Boolean)
                .join(', ') || t('common:noAddressAtPin')}
            </div>

            {effectiveCoords?.accuracy != null && (
              <div
                className={`loc-confirm-accuracy${
                  effectiveCoords.accuracy > LOW_ACCURACY_THRESHOLD_M ? ' low' : ''
                }`}
              >
                {effectiveCoords.accuracy > LOW_ACCURACY_THRESHOLD_M
                  ? t('common:gpsLowAccuracy', {
                      accuracy: Math.round(effectiveCoords.accuracy),
                    })
                  : t('common:gpsAccuracy', {
                      accuracy: Math.round(effectiveCoords.accuracy),
                    })}
              </div>
            )}

            <div className="loc-confirm-actions">
              <button
                type="button"
                className="loc-confirm-btn-primary"
                onClick={handleConfirmAddress}
              >
                {t('common:confirmLocation')}
              </button>

              <button
                type="button"
                className="loc-confirm-btn-secondary"
                onClick={() => setMapOpen(true)}
              >
                {t('common:adjustOnMap')}
              </button>

              <button
                type="button"
                className="loc-confirm-btn-secondary"
                onClick={handleRetryAddress}
              >
                {t('common:retryGps')}
              </button>

              <button
                type="button"
                className="loc-confirm-btn-text"
                onClick={handleDismissAddress}
              >
                {t('common:enterManually')}
              </button>
            </div>
          </div>
        )}

        {mapOpen && (
          <Suspense fallback={null}>
            <LocationPickerMap
              initialLat={effectiveCoords.lat}
              initialLng={effectiveCoords.lng}
              initialAccuracy={effectiveCoords.accuracy}
              onConfirm={handleMapConfirm}
              onCancel={() => setMapOpen(false)}
            />
          </Suspense>
        )}
      </div>

      <BottomSheet
        open={locationPermissionOpen}
        onClose={() =>
          setLocationPermissionOpen(false)
        }
      >
        <div className="cl-permission-icon">
          📍
        </div>

        <h3 className="cl-permission-title">
          {t(
            'listings:create.locationPermissionTitle'
          )}
        </h3>

        <p className="cl-permission-message">
          {t(
            'listings:create.locationPermissionMessage'
          )}
        </p>

        <div className="cl-permission-actions">

          <button
            type="button"
            className="sticky-bar-secondary"
            onClick={() =>
              setLocationPermissionOpen(
                false
              )
            }
          >
            {t(
              'listings:create.notNow'
            )}
          </button>

          <button
            type="button"
            className="sticky-bar-primary"
            onClick={
              handleAllowLocation
            }
          >
            {t(
              'listings:create.allowLocation'
            )}
          </button>

        </div>
      </BottomSheet>
    </>
  );
}
