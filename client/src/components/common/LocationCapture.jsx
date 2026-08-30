import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGpsLocation } from '../../hooks/useGpsLocation';
import { IconCurrentLocation } from '../icons';
import LocationSuggestInput from './LocationSuggestInput';
import {
  KARNATAKA,
  KARNATAKA_DISTRICTS,
  getTaluksForDistrict,
  getVillagesForTaluk,
} from '../../data/karnatakaLocations';
import './LocationCapture.css';

// Leaflet + react-leaflet is a real chunk of JS a farmer never needs
// unless they actually tap "Adjust on map" - lazy-loaded so it never
// costs anything on the common path (GPS fix accepted as-is).
const LocationPickerMap = lazy(() => import('./LocationPickerMap'));

// Accuracy above this (meters) is flagged as low-confidence - common
// when GPS falls back to WiFi/IP-based positioning indoors.
const LOW_ACCURACY_THRESHOLD_M = 100;

const ERROR_MESSAGE_KEY = {
  'permission-denied': 'common:gpsPermissionDenied',
  timeout: 'common:gpsTimeout',
  unavailable: 'common:gpsUnavailable',
  'position-unavailable': 'common:gpsUnavailable',
};

export default function LocationCapture({ value, onChange }) {
  const { t } = useTranslation(['common']);
  const { status, errorCode, coords, address, capture, reset } = useGpsLocation();
  const [mapOpen, setMapOpen] = useState(false);
  // Set when the farmer drags the pin on the map to a spot other than
  // the raw GPS fix - takes over from `coords`/`address` for display
  // and confirm, without touching the hook's own state.
  const [override, setOverride] = useState(null); // { lat, lng, address }

  // A 'done' status with no resolved address means GPS succeeded but
  // reverse geocoding didn't - there's nothing useful to confirm, so
  // fall straight through to manual entry instead of an empty card.
  const confirming = status === 'done' && !!address;
  const effectiveCoords = override
    ? { lat: override.lat, lng: override.lng, accuracy: null }
    : coords;
  const effectiveAddress = override ? override.address : address;

  useEffect(() => {
    if (status === 'done' && !address) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, address]);

  function handleConfirm() {
    onChange({
      ...value,
      village: effectiveAddress.village || value.village,
      taluk: effectiveAddress.taluk || value.taluk,
      district: effectiveAddress.district || value.district,
      state: effectiveAddress.state || value.state,
      lat: effectiveCoords.lat,
      lng: effectiveCoords.lng,
    });

    setOverride(null);
    reset();
  }

  function handleRetry() {
    setOverride(null);
    capture();
  }

  function handleEnterManually() {
    setOverride(null);
    reset();
  }

  function handleMapConfirm({ lat, lng, address: mapAddress }) {
    setOverride({ lat, lng, address: mapAddress || {} });
    setMapOpen(false);
  }

  function setField(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <div className="loc-capture">
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

      <div className="loc-capture-field">
        <label>{t('common:state')}</label>
        <LocationSuggestInput
          value={value.state || KARNATAKA}
          options={[KARNATAKA]}
          onChange={(v) => setField('state', v)}
          placeholder="e.g. Karnataka"
          label={t('common:state')}
        />
      </div>

      <div className="loc-capture-field">
        <label>{t('common:district')}</label>
        <LocationSuggestInput
          value={value.district}
          options={KARNATAKA_DISTRICTS}
          onChange={(v) => setField('district', v)}
          placeholder="e.g. Mandya"
          label={t('common:district')}
        />
      </div>

      <div className="loc-capture-field">
        <label>{t('common:taluk')}</label>
        <LocationSuggestInput
          value={value.taluk}
          options={getTaluksForDistrict(value.district)}
          onChange={(v) => setField('taluk', v)}
          placeholder="e.g. Mandya"
          label={t('common:taluk')}
        />
      </div>

      <div className="loc-capture-field">
        <label>{t('common:village')}</label>
        <LocationSuggestInput
          value={value.village}
          options={getVillagesForTaluk(value.district, value.taluk)}
          onChange={(v) => setField('village', v)}
          placeholder="e.g. Keragodu"
          label={t('common:village')}
        />
      </div>

      {confirming ? (
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
              onClick={handleConfirm}
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
              onClick={handleRetry}
            >
              {t('common:retryGps')}
            </button>

            <button
              type="button"
              className="loc-confirm-btn-text"
              onClick={handleEnterManually}
            >
              {t('common:enterManually')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="loc-capture-gps-btn"
          onClick={capture}
          disabled={status === 'capturing' || status === 'geocoding'}
        >
          <IconCurrentLocation size={16} strokeWidth={2} />
          {t('common:useCurrentLocation')}
        </button>
      )}

      <div className="loc-capture-status">
        {status === 'capturing' && t('common:gpsCapturing')}
        {status === 'geocoding' && t('common:gpsGeocoding')}
        {status === 'error' &&
          t(ERROR_MESSAGE_KEY[errorCode] || 'common:gpsError')}
      </div>
    </div>
  );
}
