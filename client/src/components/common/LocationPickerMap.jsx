import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { reverseGeocode } from '../../services/geocodingService';
import 'leaflet/dist/leaflet.css';
import './LocationPickerMap.css';

const REVERSE_GEOCODE_DEBOUNCE_MS = 500;

function CenterTracker({ onMoveEnd }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      onMoveEnd({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

function RecenterButton({ lat, lng, label }) {
  const map = useMap();
  return (
    <button
      type="button"
      className="loc-map-picker-recenter"
      onClick={() => map.setView([lat, lng], map.getZoom())}
      aria-label={label}
    >
      🎯
    </button>
  );
}

// Uber/Zomato-style pin-drop: the pin stays fixed at the screen center
// (plain CSS, not a Leaflet marker) and the farmer drags the *map*
// underneath it. That's deliberate - dragging a small marker precisely
// with a thumb is fiddly, while panning the whole map is the same
// gesture as scrolling, so it works reliably on low-end touchscreens.
//
// Only used as an optional refinement step on top of GPS, never a
// replacement for it - GPS gets the farmer to roughly the right spot
// in one tap, this lets them nudge the pin the last stretch when
// reverse geocoding picked the wrong village/taluk for an otherwise
// reasonable fix.
export default function LocationPickerMap({
  initialLat,
  initialLng,
  initialAccuracy,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation(['common']);
  const [center, setCenter] = useState({ lat: initialLat, lng: initialLng });
  const [address, setAddress] = useState(null);
  const [resolving, setResolving] = useState(true);

  const debounceRef = useRef(null);
  const tokenRef = useRef(0);

  const resolveAddress = useCallback((lat, lng) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const token = ++tokenRef.current;
    setResolving(true);

    debounceRef.current = setTimeout(async () => {
      const result = await reverseGeocode(lat, lng);
      if (token !== tokenRef.current) return;
      setAddress(result);
      setResolving(false);
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    resolveAddress(initialLat, initialLng);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMoveEnd(next) {
    setCenter(next);
    resolveAddress(next.lat, next.lng);
  }

  function handleConfirm() {
    onConfirm({ lat: center.lat, lng: center.lng, address });
  }

  const addressLine = address
    ? [address.village, address.taluk, address.district, address.state]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <div className="loc-map-picker">
      <div className="loc-map-picker-header">
        <button
          type="button"
          className="loc-map-picker-close"
          onClick={onCancel}
          aria-label={t('common:cancel')}
        >
          ✕
        </button>
        <div className="loc-map-picker-title">
          {t('common:adjustLocationTitle')}
        </div>
      </div>

      <div className="loc-map-picker-map">
        <MapContainer
          center={[initialLat, initialLng]}
          zoom={17}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {initialAccuracy != null && (
            <Circle
              center={[initialLat, initialLng]}
              radius={initialAccuracy}
              pathOptions={{ color: '#2e7d46', weight: 1, fillOpacity: 0.08 }}
            />
          )}
          <CenterTracker onMoveEnd={handleMoveEnd} />
          <RecenterButton
            lat={initialLat}
            lng={initialLng}
            label={t('common:recenterMap')}
          />
        </MapContainer>

        <div className="loc-map-picker-pin" aria-hidden="true">
          📍
        </div>
      </div>

      <div className="loc-map-picker-footer">
        <div className="loc-map-picker-address">
          {resolving
            ? t('common:gpsGeocoding')
            : addressLine || t('common:noAddressAtPin')}
        </div>

        <button
          type="button"
          className="loc-confirm-btn-primary"
          onClick={handleConfirm}
        >
          {t('common:usePinnedLocation')}
        </button>
      </div>
    </div>
  );
}
