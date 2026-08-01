import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reverseGeocode } from '../../services/geocodingService';
import { useToast } from '../../context/ToastContext';
import BottomSheet from './BottomSheet';

// This is Sell Crop's ORIGINAL location implementation, extracted
// verbatim so it has exactly one implementation instead of two
// separately-maintained copies that could silently drift apart.
// Both Sell Crop's and Sell Animals' Create Listing screens render
// this same component - there is no other location code path for
// either of them.
//
// Controlled: locationParts/coords live in the parent (needed there at
// save time). This component owns only its own ephemeral UI state
// (gps status, permission dialog) and reports changes upward.
export default function GpsLocationSection({ locationParts, onLocationPartsChange, coords, onCoordsChange }) {
  const { t } = useTranslation(['listings']);
  const { showToast } = useToast();
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | capturing | geocoding | captured | error
  const [locationPermissionOpen, setLocationPermissionOpen] = useState(false);

  function handleUseGpsClick() {
    setLocationPermissionOpen(true);
  }

  function handleAllowLocation() {
    setLocationPermissionOpen(false);
    requestGpsLocation();
  }

  function requestGpsLocation() {
    if (!navigator.geolocation) {
      showToast(t('listings:create.gpsUnavailable'));
      return;
    }
    setGpsStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onCoordsChange({ lat, lng });
        setGpsStatus('geocoding');

        const address = await reverseGeocode(lat, lng);
        if (address) {
          onLocationPartsChange((prev) => ({
            village: address.village || prev.village,
            taluk: address.taluk || prev.taluk,
            district: address.district || prev.district,
            state: address.state || prev.state,
          }));
          setGpsStatus('captured');
          showToast(t('listings:create.gpsCaptured'));
        } else {
          // Coordinates were captured fine but the address lookup failed -
          // keep whatever location fields the farmer already had/entered
          // rather than ever showing raw coordinates as the location.
          setGpsStatus('error');
          showToast(t('listings:create.gpsGeocodeError'));
        }
      },
      () => {
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }

  return (
    <>
      <div className="cl-loc-card">
        <div className="cl-loc-title">📍 {t('listings:create.currentLocationTitle')}</div>

        {(['village', 'taluk', 'district', 'state']).map((field) => (
          <div className="cl-loc-row" key={field}>
            <label>{t(`listings:create.${field}`)}</label>
            <input
              type="text"
              value={locationParts[field]}
              onChange={(e) => onLocationPartsChange((prev) => ({ ...prev, [field]: e.target.value }))}
              placeholder="—"
            />
          </div>
        ))}

        <button type="button" className="cl-gps-btn" onClick={handleUseGpsClick}>
          📍 {t('listings:create.useGps')}
        </button>
        {gpsStatus === 'capturing' && <div className="cl-gps-status">{t('listings:create.gpsCapturing')}</div>}
        {gpsStatus === 'geocoding' && <div className="cl-gps-status">{t('listings:create.gpsGeocoding')}</div>}
        {gpsStatus === 'error' && <div className="cl-gps-status cl-gps-error">{t('listings:create.gpsError')}</div>}
      </div>

      <BottomSheet open={locationPermissionOpen} onClose={() => setLocationPermissionOpen(false)}>
        <div className="cl-permission-icon">📍</div>
        <h3 className="cl-permission-title">{t('listings:create.locationPermissionTitle')}</h3>
        <p className="cl-permission-message">{t('listings:create.locationPermissionMessage')}</p>
        <div className="cl-permission-actions">
          <button className="sticky-bar-secondary" onClick={() => setLocationPermissionOpen(false)}>
            {t('listings:create.notNow')}
          </button>
          <button className="sticky-bar-primary" onClick={handleAllowLocation}>
            {t('listings:create.allowLocation')}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
