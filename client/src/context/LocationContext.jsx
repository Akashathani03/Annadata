import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_LOCATION, GPS_STALE_THRESHOLD_MS } from '../config/constants';
import { forwardGeocode } from '../services/geocodingService';

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
  const [geocodedLocation, setGeocodedLocation] = useState(null);
  const capturedAtRef = useRef(null);
  const inFlightRef = useRef(false);
  const cancelledRef = useRef(false);

  function requestLocation() {
    if (inFlightRef.current) return; // never overlap two in-flight requests
    if (!navigator.geolocation) {
      if (import.meta.env.DEV) console.warn('[LocationContext] navigator.geolocation is unavailable in this browser/context.');
      return; // gracefully unavailable, falls through to profile/default
    }
    inFlightRef.current = true;
    if (import.meta.env.DEV) console.log('[LocationContext] GPS requested');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // A request started before this instance was unmounted (e.g.
        // React.StrictMode's dev-only mount->unmount->mount) can still
        // resolve after the fact - ignore it rather than let a stale
        // result overwrite the current, active instance's location.
        if (cancelledRef.current) return;
        if (import.meta.env.DEV) {
          console.log('[LocationContext] GPS success', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        }
        setLiveLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        capturedAtRef.current = Date.now();
        inFlightRef.current = false;
      },
      (error) => {
        // Same cancellation check as the success callback above - a
        // stale error from a discarded instance must not affect the
        // current one either.
        if (cancelledRef.current) return;
        // error.code: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE,
        // 3 = TIMEOUT. Logged (dev only) rather than silently
        // discarded - the previous parameterless callback made denied/
        // timeout/unavailable structurally indistinguishable. Denied,
        // unavailable, or timed out all fall back the same way -
        // the browser's own permission prompt is the only UI this
        // needs; no extra app-level message, and no repeat prompt.
        if (import.meta.env.DEV) console.warn('[LocationContext] GPS failed', { code: error.code, message: error.message });
        inFlightRef.current = false;
      },
      // Aligned with GpsLocationSection's already-correct settings -
      // enableHighAccuracy asks for a genuine GPS fix rather than a
      // coarser network/cell-tower estimate, and explicit
      // maximumAge: 0 guarantees a fresh position rather than
      // relying on an implicit default that different browsers can
      // interpret differently ("do not blindly use cached
      // coordinates", per the approved requirement).
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  useEffect(() => {
    cancelledRef.current = false;
    requestLocation();
    return () => {
      cancelledRef.current = true;
    };
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

  // Geocodes the farmer's saved profile address (village/taluk/
  // district/state) into approximate coordinates, but only as a last
  // resort between saved GPS and the hardcoded default - never
  // instead of either. Fires once per user once live GPS has had a
  // chance to resolve; does not re-fire repeatedly, respecting
  // Nominatim's usage policy. Never touches liveLocation, so the
  // "current location" label elsewhere (which checks liveLocation
  // specifically) is never misapplied to this approximate result.
  const liveLocationRef = useRef(null);
  liveLocationRef.current = liveLocation;

  const geocodeAttemptedForUserRef = useRef(null);
  useEffect(() => {
    if (!user) return;
    if (user.lat != null && user.lng != null) return; // saved GPS already covers this
    if (!user.district || !user.state) return; // too little address to search meaningfully
    if (geocodeAttemptedForUserRef.current === user.id) return; // already tried this user this session

    let cancelled = false;
    geocodeAttemptedForUserRef.current = user.id;

    // Give live GPS a real chance first - only geocode the saved
    // address if GPS still hasn't resolved by the time this fires.
    // Reads liveLocationRef (always current) rather than closing over
    // the liveLocation value from when this effect first ran, so a
    // GPS success in the meantime is correctly seen and this call is
    // genuinely skipped, not just harmlessly wasted.
    const timer = setTimeout(async () => {
      if (cancelled || liveLocationRef.current) return;
      const result = await forwardGeocode({
        village: user.village,
        taluk: user.taluk,
        district: user.district,
        state: user.state,
      });
      if (!cancelled && !liveLocationRef.current) setGeocodedLocation(result);
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.lat, user?.lng, user?.village, user?.taluk, user?.district, user?.state]);

  // Geocodes the profile address for profile-first features (Market
  // Prices), independently of the GPS-deferred geocodedLocation above.
  // Fires immediately - never waits on or yields to live GPS - so
  // profileLat/profileLng reflect the saved address even when GPS
  // resolves quickly (the case the GPS-deferred geocode above misses).
  //
  // Deliberately runs even when user.lat/lng are already set (unlike
  // the GPS-deferred geocode above) - a farmer's typed district/state
  // is what they can see and correct on the Profile screen, while
  // lat/lng is invisible plumbing they never review. A stale or
  // coarse GPS fix from months ago (or a desktop/IP-based fix that
  // landed in the wrong city) can leave user.lat/lng permanently
  // wrong even after the farmer fixes their district text - trusting
  // that lat/lng over the address they just corrected would silently
  // keep showing them the old, wrong city. See profileLat/profileLng
  // below for the priority this produces.
  const [profileGeocodedLocation, setProfileGeocodedLocation] = useState(null);
  const profileGeocodeAttemptedForUserRef = useRef(null);
  useEffect(() => {
    if (!user) return;
    if (!user.district || !user.state) return; // too little address to search meaningfully
    if (profileGeocodeAttemptedForUserRef.current === user.id) return; // already tried this user this session

    let cancelled = false;
    profileGeocodeAttemptedForUserRef.current = user.id;

    forwardGeocode({
      village: user.village,
      taluk: user.taluk,
      district: user.district,
      state: user.state,
    }).then((result) => {
      if (!cancelled) setProfileGeocodedLocation(result);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.lat, user?.lng, user?.village, user?.taluk, user?.district, user?.state]);

  // geocodedLocation (this session's typed-address fallback) is
  // checked ahead of the raw saved user.lat/lng for the same reason as
  // profileLat/profileLng below: a farmer can see and fix a wrong
  // district/state on the Profile screen, but never sees the raw
  // lat/lng, so a stale or coarse fix from months ago can outrank a
  // freshly-correct address indefinitely otherwise. Live GPS from
  // this session still wins over both, since it's the one source that
  // is actually current.
  const lat = liveLocation?.lat ?? geocodedLocation?.lat ?? user?.lat ?? DEFAULT_LOCATION.lat;
  const lng = liveLocation?.lng ?? geocodedLocation?.lng ?? user?.lng ?? DEFAULT_LOCATION.lng;

  // Profile-first coordinates, for features (Market Prices) that must
  // reflect the farmer's registered address rather than wherever the
  // device's live GPS currently reports. Never falls through to
  // liveLocation - only the profile's address, its saved lat/lng, or
  // the hardcoded default.
  //
  // The geocoded typed address comes first, ahead of the raw saved
  // lat/lng - district/state is what the farmer typed and can see is
  // right on the Profile screen; lat/lng is a number they never see,
  // and can go stale (an old capture, or a coarse desktop/IP-based
  // fix that landed in the wrong city - Bengaluru's IP ranges are a
  // common false positive for farmers physically elsewhere in
  // Karnataka). Only fall back to the raw lat/lng when there's no
  // district/state to geocode at all.
  const profileLat = profileGeocodedLocation?.lat ?? user?.lat ?? DEFAULT_LOCATION.lat;
  const profileLng = profileGeocodedLocation?.lng ?? user?.lng ?? DEFAULT_LOCATION.lng;

  const value = { lat, lng, profileLat, profileLng, liveLocation, geocodedLocation, refreshIfStale };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useUserLocation must be used within a LocationProvider');
  return ctx;
}
