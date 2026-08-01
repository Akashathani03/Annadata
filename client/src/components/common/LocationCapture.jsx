import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reverseGeocode } from '../../services/geocodingService';
import { IconCurrentLocation } from '../icons';
import './LocationCapture.css';

// Accuracy above this (meters) is flagged as low-confidence - common
// when GPS falls back to WiFi/IP-based positioning indoors.
const LOW_ACCURACY_THRESHOLD_M = 100;

export default function LocationCapture({ value, onChange }) {
  const { t } = useTranslation(['common']);
  const [status, setStatus] = useState('idle'); // idle | capturing | geocoding | confirming | error
  const [pending, setPending] = useState(null); // { village, taluk, district, state, lat, lng, accuracy }

  function setField(field, fieldValue) {
    onChange({ ...value, [field]: fieldValue });
  }

  function handleUseGps() {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy; // meters
        setStatus('geocoding');

        const address = await reverseGeocode(lat, lng);
        if (address && (address.village || address.taluk || address.district || address.state)) {
          setPending({ ...address, lat, lng, accuracy });
          setStatus('confirming');
        } else {
          // Coordinates captured fine but no address could be resolved -
          // nothing meaningful to confirm, so go straight to the error/
          // retry state rather than showing an empty confirmation card.
          setStatus('error');
        }
      },
      () => setStatus('error'),
      // enableHighAccuracy avoids silently falling back to coarse
      // WiFi/IP-based positioning; maximumAge:0 forces a fresh reading
      // instead of a stale cached one; timeout prevents hanging forever
      // on a weak signal.
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }

  function handleConfirm() {
    onChange({
      ...value,
      village: pending.village || value.village,
      taluk: pending.taluk || value.taluk,
      district: pending.district || value.district,
      state: pending.state || value.state,
      lat: pending.lat,
      lng: pending.lng,
    });
    setPending(null);
    setStatus('idle');
  }

  function handleRetry() {
    setPending(null);
    handleUseGps();
  }

  function handleEnterManually() {
    setPending(null);
    setStatus('idle');
  }

  return (
    <div className="loc-capture">
      {status !== 'confirming' && (
        <button type="button" className="loc-capture-gps-btn" onClick={handleUseGps}>
          <IconCurrentLocation size={16} strokeWidth={2} /> {t('common:useCurrentLocation')}
        </button>
      )}

      <div className="loc-capture-status">
        {status === 'capturing' && t('common:gpsCapturing')}
        {status === 'geocoding' && t('common:gpsGeocoding')}
        {status === 'error' && t('common:gpsError')}
      </div>

      {status === 'confirming' && pending && (
        <div className="loc-confirm-card">
          <div className="loc-confirm-title">{t('common:confirmDetectedTitle')}</div>
          <div className="loc-confirm-address">
            {[pending.village, pending.taluk, pending.district, pending.state].filter(Boolean).join(', ')}
          </div>
          {pending.accuracy != null && (
            <div className={`loc-confirm-accuracy${pending.accuracy > LOW_ACCURACY_THRESHOLD_M ? ' low' : ''}`}>
              {pending.accuracy > LOW_ACCURACY_THRESHOLD_M
                ? t('common:gpsLowAccuracy', { accuracy: Math.round(pending.accuracy) })
                : t('common:gpsAccuracy', { accuracy: Math.round(pending.accuracy) })}
            </div>
          )}
          <div className="loc-confirm-actions">
            <button type="button" className="loc-confirm-btn-primary" onClick={handleConfirm}>
              {t('common:confirmLocation')}
            </button>
            <button type="button" className="loc-confirm-btn-secondary" onClick={handleRetry}>
              {t('common:retryGps')}
            </button>
            <button type="button" className="loc-confirm-btn-text" onClick={handleEnterManually}>
              {t('common:enterManually')}
            </button>
          </div>
        </div>
      )}

      <div className="loc-capture-field">
        <label>{t('common:village')}</label>
        <input value={value.village || ''} onChange={(e) => setField('village', e.target.value)} placeholder="e.g. Keragodu" />
      </div>
      <div className="loc-capture-field">
        <label>{t('common:taluk')}</label>
        <input value={value.taluk || ''} onChange={(e) => setField('taluk', e.target.value)} placeholder="e.g. Mandya" />
      </div>
      <div className="loc-capture-field">
        <label>{t('common:district')}</label>
        <input value={value.district || ''} onChange={(e) => setField('district', e.target.value)} placeholder="e.g. Mandya" />
      </div>
      <div className="loc-capture-field">
        <label>{t('common:state')}</label>
        <input value={value.state || ''} onChange={(e) => setField('state', e.target.value)} placeholder="e.g. Karnataka" />
      </div>
    </div>
  );
}
