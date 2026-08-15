import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reverseGeocode } from '../../services/geocodingService';
import { updateUserProfile } from '../../services/usersService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BottomSheet from './BottomSheet';

export default function GpsLocationSection({
  locationParts,
  onLocationPartsChange,
  coords,
  onCoordsChange,
}) {
  const { t } = useTranslation(['listings']);
  const { showToast } = useToast();
  const { user, refreshUser } = useAuth();

  const [gpsStatus, setGpsStatus] = useState('idle');
  const [locationPermissionOpen, setLocationPermissionOpen] =
    useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
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
      await updateUserProfile(user.id, {
        lat,
        lng,
      });

      if (mountedRef.current) {
        await refreshUser();
      }
    } catch {
      // Profile location persistence is not required for
      // the current listing, so failures stay silent.
    }
  }

  /*
   * Open our own permission explanation first.
   */
  function handleUseGpsClick() {
    if (gpsStatus === 'capturing' || gpsStatus === 'geocoding') {
      return;
    }

    setLocationPermissionOpen(true);
  }

  /*
   * User accepted our explanation.
   */
  function handleAllowLocation() {
    setLocationPermissionOpen(false);
    requestGpsLocation();
  }

  /*
   * Request fresh high-accuracy GPS.
   */
  function requestGpsLocation() {
    if (!navigator.geolocation) {
      setGpsStatus('error');

      showToast(
        t('listings:create.gpsUnavailable')
      );

      return;
    }

    setGpsStatus('capturing');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!mountedRef.current) return;

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        /*
         * Save coordinates immediately.
         *
         * Even if reverse geocoding fails, the listing still
         * has valid GPS coordinates.
         */
        onCoordsChange({
          lat,
          lng,
          accuracy,
        });

        /*
         * Save GPS position to user profile in the background.
         */
        persistLocationToProfile(lat, lng);

        setGpsStatus('geocoding');

        try {
          const address = await reverseGeocode(
            lat,
            lng
          );

          if (!mountedRef.current) return;

          if (
            address &&
            (
              address.village ||
              address.taluk ||
              address.district ||
              address.state
            )
          ) {
            /*
             * Merge the detected address with the
             * existing manually entered values.
             */
            onLocationPartsChange((prev) => ({
              village:
                address.village ||
                prev.village ||
                '',

              taluk:
                address.taluk ||
                prev.taluk ||
                '',

              district:
                address.district ||
                prev.district ||
                '',

              state:
                address.state ||
                prev.state ||
                '',
            }));

            setGpsStatus('captured');

            showToast(
              t('listings:create.gpsCaptured')
            );
          } else {
            /*
             * GPS worked, but no useful address was found.
             * Keep the coordinates.
             */
            setGpsStatus('captured');

            showToast(
              t(
                'listings:create.gpsGeocodeError'
              )
            );
          }
        } catch {
          if (!mountedRef.current) return;

          /*
           * Coordinates are still valid even though
           * reverse geocoding failed.
           */
          setGpsStatus('captured');

          showToast(
            t(
              'listings:create.gpsGeocodeError'
            )
          );
        }
      },

      (error) => {
        if (!mountedRef.current) return;

        if (import.meta.env.DEV) {
          console.warn(
            '[GpsLocationSection] GPS failed',
            {
              code: error.code,
              message: error.message,
            }
          );
        }

        setGpsStatus('error');

        /*
         * Different browser GPS error codes:
         *
         * 1 = permission denied
         * 2 = position unavailable
         * 3 = timeout
         */
        if (error.code === 1) {
          showToast(
            t(
              'listings:create.gpsPermissionDenied'
            )
          );
        } else if (error.code === 3) {
          showToast(
            t(
              'listings:create.gpsTimeout'
            )
          );
        } else {
          showToast(
            t(
              'listings:create.gpsError'
            )
          );
        }
      },

      {
        /*
         * Request actual device GPS instead of
         * coarse IP/WiFi location when possible.
         */
        enableHighAccuracy: true,

        /*
         * Never use an old cached position.
         */
        maximumAge: 0,

        /*
         * Don't keep the farmer waiting forever.
         */
        timeout: 15000,
      }
    );
  }

  const isGpsBusy =
    gpsStatus === 'capturing' ||
    gpsStatus === 'geocoding';

  return (
    <>
      <div className="cl-loc-card">

        <div className="cl-loc-title">
          📍 {t(
            'listings:create.currentLocationTitle'
          )}
        </div>

        {[
          'village',
          'taluk',
          'district',
          'state',
        ].map((field) => (
          <div
            className="cl-loc-row"
            key={field}
          >
            <label>
              {t(
                `listings:create.${field}`
              )}
            </label>

            <input
              type="text"
              value={
                locationParts?.[field] || ''
              }
              onChange={(e) =>
                onLocationPartsChange(
                  (prev) => ({
                    ...prev,
                    [field]:
                      e.target.value,
                  })
                )
              }
              placeholder="—"
            />
          </div>
        ))}

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

        {gpsStatus === 'capturing' && (
          <div className="cl-gps-status">
            {t(
              'listings:create.gpsCapturing'
            )}
          </div>
        )}

        {gpsStatus === 'geocoding' && (
          <div className="cl-gps-status">
            {t(
              'listings:create.gpsGeocoding'
            )}
          </div>
        )}

        {gpsStatus === 'captured' && (
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

        {gpsStatus === 'error' && (
          <div className="cl-gps-status cl-gps-error">
            {t(
              'listings:create.gpsError'
            )}
          </div>
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