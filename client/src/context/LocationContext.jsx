import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_LOCATION, GPS_STALE_THRESHOLD_MS } from '../config/constants';

const LocationContext = createContext(null);

// Requests the browser's geolocation once on app load, then again only
// when Home explicitly asks via refreshIfStale() and the cached fix
// has aged past GPS_STALE_THRESHOLD_MS - never a background timer,
// never prompted repeatedly, never a manual button. A farmer who's
// traveled since the last capture gets a fresh location the next time
// they land on Home, with no extra tap and no visible "refreshing"
// state beyond the data itself updating.
//
// Naming this useUserLocation (not useLocation) deliberately - React
// Router already exports its own useLocation hook for the current
// route, and reusing that name would be a real collision risk in any
// file that needs both.
export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [liveLocation, setLiveLocation] = useState(null);
  const capturedAtRef = useRef(null);
  const inFlightRef = useRef(false);

  function requestLocation() {
    if (inFlightRef.current) return; // never overlap two in-flight requests
    if (!navigator.geolocation) return; // gracefully unavailable, falls through to profile/default
    inFlightRef.current = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLiveLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        capturedAtRef.current = Date.now();
        inFlightRef.current = false;
      },
      () => {
        // Denied, unavailable, or timed out - silently fall back. The
        // browser's own permission prompt is the only UI this needs;
        // no extra app-level message, and no repeat prompt - a prior
        // denial just makes this call fail quickly again, same as
        // any other geolocation call after a block decision.
        inFlightRef.current = false;
      },
      { timeout: 10000 }
    );
  }

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called by Home when it becomes active. Reuses the current session
  // location if it's still fresh; only re-requests GPS once the cached
  // fix has genuinely aged past the configurable threshold.
  function refreshIfStale() {
    const age = capturedAtRef.current ? Date.now() - capturedAtRef.current : Infinity;
    if (age > GPS_STALE_THRESHOLD_MS) {
      requestLocation();
    }
  }

  const lat = liveLocation?.lat ?? user?.lat ?? DEFAULT_LOCATION.lat;
  const lng = liveLocation?.lng ?? user?.lng ?? DEFAULT_LOCATION.lng;

  const value = { lat, lng, liveLocation, refreshIfStale };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useUserLocation must be used within a LocationProvider');
  return ctx;
}
