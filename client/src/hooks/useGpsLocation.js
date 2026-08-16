import { useCallback, useEffect, useRef, useState } from 'react';
import { reverseGeocode } from '../services/geocodingService';

// A fix at or under this accuracy (meters) is treated as good enough to
// stop watching early instead of waiting out the full timeout.
const GOOD_ACCURACY_M = 50;
const GPS_TIMEOUT_MS = 15000;

function mapGeolocationError(error) {
  switch (error.code) {
    case 1:
      return 'permission-denied';
    case 2:
      return 'position-unavailable';
    case 3:
      return 'timeout';
    default:
      return 'unavailable';
  }
}

// Captures the device's GPS position and reverse-geocodes it into a
// Village/Taluk/District/State breakdown. Shared by every location-
// capture surface (profile, listing forms) so a fix here fixes all of
// them at once.
//
// Uses watchPosition (not a single getCurrentPosition call) so the
// caller can show a fix the instant one arrives and let it silently
// improve - the browser's first callback is often a fast network/cell
// estimate, with later callbacks converging on the true GPS fix as the
// chip warms up. Watching stops as soon as a fix is accurate enough
// (GOOD_ACCURACY_M) or GPS_TIMEOUT_MS elapses, whichever comes first -
// never left running indefinitely. On timeout, whatever fix has
// already arrived (even a coarse one) is used rather than discarded,
// so a slow-to-lock GPS still produces a result instead of a bare
// error.
export function useGpsLocation() {
  const [status, setStatus] = useState('idle'); // idle | capturing | geocoding | done | error
  const [errorCode, setErrorCode] = useState(null); // permission-denied | position-unavailable | timeout | unavailable
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy }
  const [address, setAddress] = useState(null); // { village, taluk, district, state } | null

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const coordsRef = useRef(null);
  const mountedRef = useRef(true);
  const tokenRef = useRef(0);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopWatch();
    };
  }, [stopWatch]);

  const finalize = useCallback(
    async (token) => {
      stopWatch();
      const fix = coordsRef.current;
      if (!fix) {
        if (mountedRef.current && token === tokenRef.current) {
          setStatus('error');
          setErrorCode('timeout');
        }
        return;
      }

      if (mountedRef.current && token === tokenRef.current) setStatus('geocoding');

      try {
        const addr = await reverseGeocode(fix.lat, fix.lng);
        if (!mountedRef.current || token !== tokenRef.current) return;
        setAddress(addr && (addr.village || addr.taluk || addr.district || addr.state) ? addr : null);
        setStatus('done');
      } catch {
        if (!mountedRef.current || token !== tokenRef.current) return;
        setAddress(null);
        setStatus('done');
      }
    },
    [stopWatch]
  );

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorCode('unavailable');
      return;
    }

    stopWatch();
    const token = ++tokenRef.current;
    coordsRef.current = null;
    setStatus('capturing');
    setErrorCode(null);
    setCoords(null);
    setAddress(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!mountedRef.current || token !== tokenRef.current) return;

        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        coordsRef.current = next;
        setCoords(next);

        if (next.accuracy <= GOOD_ACCURACY_M) {
          finalize(token);
        }
      },
      (error) => {
        if (!mountedRef.current || token !== tokenRef.current) return;

        // A usable fix already arrived before this error fired (e.g. a
        // later watch callback timing out) - keep it rather than
        // throwing away a good result.
        if (coordsRef.current) {
          finalize(token);
          return;
        }

        stopWatch();
        setStatus('error');
        setErrorCode(mapGeolocationError(error));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: GPS_TIMEOUT_MS }
    );

    watchIdRef.current = watchId;
    timerRef.current = setTimeout(() => finalize(token), GPS_TIMEOUT_MS);
  }, [stopWatch, finalize]);

  const reset = useCallback(() => {
    tokenRef.current++;
    coordsRef.current = null;
    stopWatch();
    setStatus('idle');
    setErrorCode(null);
    setCoords(null);
    setAddress(null);
  }, [stopWatch]);

  return { status, errorCode, coords, address, capture, reset };
}
