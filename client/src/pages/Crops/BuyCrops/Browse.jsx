import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getBrowseCrops } from '../../../services/buyCropsService';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { formatRelativeTime } from '../../../utils/formatDate';
import {
  getBuyerLocation,
  updateBuyerLocation,
} from '../../../services/buyerLocationService';
import ListingSkeleton from '../../../components/common/ListingSkeleton';
import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';
import { reverseGeocode } from '../../../services/geocodingService';
import {
  buyCropsCategories,
  buyCropsSorts,
  buyCropsDistances,
} from '../../../config/buyCropsConfig';
import { useToast } from '../../../context/ToastContext';

import AppShell from '../../../components/common/AppShell';
import SearchInput from '../../../components/common/SearchInput';
import ChipScroller from '../../../components/common/ChipScroller';
import OptionList from '../../../components/common/OptionList';
import BottomSheet from '../../../components/common/BottomSheet';

import './BuyCrops.css';

// Buy Crop browsing:
// - Search
// - Category
// - Distance
// - Sort
// - Buyer location
//
// No separate Filter sheet is used.

export default function Browse() {
  const navigate = useNavigate();

  const { t } = useTranslation([
    'buyCrops',
    'common',
  ]);

  const { showToast } = useToast();
  const { user } = useAuth();
  const { liveLocation, geocodedLocation } = useUserLocation();

  const [buyerLoc, setBuyerLoc] = useState(null);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('nearest');
  const [distance, setDistance] = useState('All');

  const [results, setResults] = useState([]);

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [sortSheetOpen, setSortSheetOpen] =
    useState(false);

  const [locationSheetOpen, setLocationSheetOpen] =
    useState(false);

  const [gpsStatus, setGpsStatus] =
    useState('idle');
  // idle | capturing | detected | geocoded | error

  const [pendingGps, setPendingGps] =
    useState(null);

  const [locForm, setLocForm] = useState({
    village: '',
    taluk: '',
    district: '',
    state: '',
  });

  /*
   * Load the buyer's saved/profile location.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadLocation() {
      setLocationLoading(true);

      try {
        const loc = await getBuyerLocation({
          authenticatedUser: user,
          liveLocation,
          geocodedLocation,
        });

        if (cancelled) return;

        setBuyerLoc(loc ?? null);
      } catch {
        if (cancelled) return;

        setBuyerLoc(null);

        showToast(
          t('locationSheet.loadFailed', {
            defaultValue:
              'Unable to load your location.',
          })
        );
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    }

    loadLocation();

    return () => {
      cancelled = true;
    };
  }, [user, liveLocation, geocodedLocation, showToast, t]);

  /*
   * Fetch crops whenever the browsing criteria changes.
   *
   * requestId prevents an older/slower request from
   * overwriting the results of a newer search.
   */
  useEffect(() => {
    if (!buyerLoc) {
      setResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      setSearchLoading(true);

      try {
        const list = await getBrowseCrops({
          query,
          category,
          sort,
          filters: {
            distance,
          },
          buyerLat: buyerLoc?.lat,
          buyerLng: buyerLoc?.lng,
        });

        if (cancelled) return;

        setResults(
          Array.isArray(list)
            ? list
            : []
        );
      } catch {
        if (cancelled) return;

        setResults([]);

        showToast(
          t('searchFailed', {
            defaultValue:
              'Unable to load crops. Please try again.',
          })
        );
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [
    buyerLoc,
    query,
    category,
    sort,
    distance,
    showToast,
    t,
  ]);

  const categoryOptions =
    buyCropsCategories.map((c) => ({
      id: c.id,
      icon: c.icon,
      label: t(c.labelKey),
    }));

  const sortOptions =
    buyCropsSorts.map((s) => ({
      id: s.id,
      label: t(s.labelKey),
    }));

  const distanceOptions =
    buyCropsDistances.map((km) => ({
      id: km,
      icon: '📍',
      label:
        km === 'All'
          ? t('distances.all')
          : t(`distances.within${km}`),
    }));

  function handleClearFilters() {
    setQuery('');
    setCategory('All');
    setSort('price_low');
    setDistance('All');

    showToast(
      t('filtersCleared')
    );
  }

  function openLocationSheet() {
    setLocForm({
      village: buyerLoc?.village ?? '',
      taluk: buyerLoc?.taluk ?? '',
      district: buyerLoc?.district ?? '',
      state: buyerLoc?.state ?? '',
    });

    setPendingGps(
      buyerLoc?.lat != null &&
        buyerLoc?.lng != null
        ? {
            lat: buyerLoc.lat,
            lng: buyerLoc.lng,
          }
        : null
    );

    if (buyerLoc?.village) {
      setGpsStatus('geocoded');
    } else {
      setGpsStatus('idle');
    }

    setLocationSheetOpen(true);
  }

  function handleUseGps() {
    if (!navigator.geolocation) {
      setGpsStatus('error');

      showToast(
        t('locationSheet.gpsUnavailable')
      );

      return;
    }

    setGpsStatus('capturing');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPendingGps({
          lat,
          lng,
        });

        setGpsStatus('detected');

        try {
          const address =
            await reverseGeocode(lat, lng);

          if (address) {
            setLocForm((prev) => ({
              village:
                address.village ||
                prev.village,

              taluk:
                address.taluk ||
                prev.taluk,

              district:
                address.district ||
                prev.district,

              state:
                address.state ||
                prev.state,
            }));

            setGpsStatus('geocoded');
          } else {
            /*
             * GPS worked but address lookup didn't.
             * Keep coordinates internally but never
             * expose raw coordinates to the farmer.
             */
            setGpsStatus('detected');
          }
        } catch {
          /*
           * GPS coordinates are still valid even if
           * reverse geocoding fails.
           */
          setGpsStatus('detected');
        }
      },
      () => {
        setGpsStatus('error');

        showToast(
          t('locationSheet.gpsError')
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  }

  async function handleSaveLocation() {
    const label =
      [
        locForm.village,
        locForm.taluk,
        locForm.district,
      ]
        .filter(Boolean)
        .join(', ') ||
      buyerLoc?.label ||
      '';

    /*
     * Don't save a completely empty location.
     */
    if (
      !locForm.village &&
      !locForm.taluk &&
      !locForm.district &&
      !locForm.state &&
      !pendingGps &&
      !buyerLoc
    ) {
      showToast(
        t('locationSheet.invalid', {
          defaultValue:
            'Please enter your location.',
        })
      );

      return;
    }

    try {
      const updated =
        await updateBuyerLocation({
          village: locForm.village,
          taluk: locForm.taluk,
          district: locForm.district,
          state: locForm.state,
          label,

          lat:
            pendingGps?.lat ??
            buyerLoc?.lat ??
            null,

          lng:
            pendingGps?.lng ??
            buyerLoc?.lng ??
            null,
        });

      setBuyerLoc(updated ?? null);
      setLocationSheetOpen(false);

      showToast(
        t('locationSheet.saved')
      );
    } catch {
      showToast(
        t('locationSheet.saveFailed', {
          defaultValue:
            'Unable to save location. Please try again.',
        })
      );
    }
  }

  const locationLabel =
    buyerLoc?.label ||
    [
      buyerLoc?.village,
      buyerLoc?.taluk,
      buyerLoc?.district,
    ]
      .filter(Boolean)
      .join(', ') ||
    t('locationSheet.notSet', {
      defaultValue: 'Location not set',
    });

  return (
    <AppShell
      title={t('title')}
      onBack={() => navigate('/')}
    >
      <div className="bc-intro">
        <h2>{t('title')}</h2>
        <p>{t('subtitle')}</p>
      </div>

      <div className="bc-locrow">
        <span className="pin">
          📍 {locationLabel}
        </span>

        <button
          type="button"
          className="bc-change-location"
          onClick={openLocationSheet}
        >
          {t('changeLocation')}
        </button>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t('searchPlaceholder')}
      />

      <ChipScroller
        options={categoryOptions}
        activeId={category}
        onChange={setCategory}
      />

      <ChipScroller
        options={distanceOptions}
        activeId={distance}
        onChange={setDistance}
      />

      <div className="bc-toolbar">
        <button
          type="button"
          onClick={() =>
            setSortSheetOpen(true)
          }
        >
          ↕ {t('sort')}
        </button>
      </div>

      <div className="bc-sec-head">
        <h4>{t('cropsNearYou')}</h4>

        <span>
          {t('resultsCount', {
            count: results.length,
          })}
        </span>
      </div>

      {locationLoading ? (
        <ListingSkeleton />
      ) : searchLoading ? (
        <ListingSkeleton />
      ) : results.length === 0 ? (
        <div className="bc-empty">
          <span className="ic">🌾</span>

          <b>{t('emptyTitle')}</b>

          <p>{t('emptyBody')}</p>

          <div className="row">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={handleClearFilters}
            >
              {t('clearFilters')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleClearFilters}
            >
              {t('viewAllCrops')}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {results.map((listing) => (
            <div
              className="bc-crop-card"
              key={listing.id}
              onClick={() =>
                navigate(
                  `/buy/${listing.id}`
                )
              }
            >
              <div className="bc-crop-top">
                <div className="bc-crop-thumb">
                  {listing.photoUrl ? (
                    <img
                      src={resolveImageUrl(
                        listing.photoUrl
                      )}
                      alt=""
                    />
                  ) : (
                    listing.cropIcon
                  )}
                </div>

                <div className="bc-crop-info">
                  <b>
                    {listing.itemName}

                    {listing.cropKannadaName && (
                      <span className="bc-crop-kn">
                        {' '}
                        /{' '}
                        {
                          listing.cropKannadaName
                        }
                      </span>
                    )}
                  </b>

                  <span className="bc-farmer">
                    👨‍🌾{' '}
                    {listing.farmerName ||
                      'Farmer'}
                  </span>

                  <span className="bc-loc">
                    📍{' '}
                    {listing.location || '—'}

                    {listing.distanceKm != null &&
                      ` · ${Number(
                        listing.distanceKm
                      ).toFixed(1)} km away`}
                  </span>
                </div>

                <span className="bc-avail-pill">
                  {t('available')}
                </span>
              </div>

              <div className="bc-crop-mid">
                <div>
                  <span>
                    {t('quantity')}
                  </span>

                  <b>
                    {listing.quantity}{' '}
                    {listing.unit}
                  </b>
                </div>

                <div>
                  <span>
                    {t('price')}
                  </span>

                  <b>
                    ₹{listing.price} /{' '}
                    {listing.unit}
                  </b>
                </div>
              </div>

              <div className="bc-updated">
                Updated{' '}
                {formatRelativeTime(
                  listing.updatedAt
                )}
              </div>

              <div
                className="bc-crop-actions"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <button
                  type="button"
                  className="btn-view"
                  onClick={() =>
                    navigate(
                      `/buy/${listing.id}`
                    )
                  }
                >
                  {t('view')}
                </button>

                {listing.phone ? (
                  <>
                    <a
                      className="btn-call"
                      href={`tel:${listing.phone}`}
                    >
                      {t('call')}
                    </a>

                    <a
                      className="btn-whatsapp"
                      href={`https://wa.me/91${listing.phone}?text=${encodeURIComponent(
                        t(
                          'detail.whatsappMessage',
                          {
                            crop:
                              listing.itemName,
                          }
                        )
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('chat')}
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-call"
                      disabled
                    >
                      {t('call')}
                    </button>

                    <button
                      type="button"
                      className="btn-whatsapp"
                      disabled
                    >
                      {t('chat')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet
        open={sortSheetOpen}
        onClose={() =>
          setSortSheetOpen(false)
        }
      >
        <h3>{t('sortSheet.title')}</h3>

        <OptionList
          options={sortOptions}
          activeId={sort}
          onChange={(id) => {
            setSort(id);
            setSortSheetOpen(false);
          }}
        />
      </BottomSheet>

      <BottomSheet
        open={locationSheetOpen}
        onClose={() =>
          setLocationSheetOpen(false)
        }
      >
        <h3>
          {t('locationSheet.title')}
        </h3>

        <p>
          {t('locationSheet.subtitle')}
        </p>

        <button
          type="button"
          className="sticky-bar-secondary cl-gps-btn"
          onClick={handleUseGps}
          disabled={gpsStatus === 'capturing'}
        >
          {gpsStatus === 'capturing'
            ? t(
                'locationSheet.gpsCapturing'
              )
            : t(
                'locationSheet.useGps'
              )}
        </button>

        <div className="bc-gps-result">
          {gpsStatus === 'capturing' &&
            t(
              'locationSheet.gpsCapturing'
            )}

          {gpsStatus === 'detected' &&
            t(
              'locationSheet.gpsDetected'
            )}

          {gpsStatus === 'geocoded' &&
            `✓ ${[
              locForm.village,
              locForm.taluk,
              locForm.district,
            ]
              .filter(Boolean)
              .join(', ')}`}

          {gpsStatus === 'error' &&
            t(
              'locationSheet.gpsError'
            )}
        </div>

        <div className="profile-field">
          <label>
            {t('locationSheet.village')}
          </label>

          <input
            type="text"
            value={locForm.village}
            onChange={(e) =>
              setLocForm((form) => ({
                ...form,
                village:
                  e.target.value,
              }))
            }
            placeholder="e.g. Keragodu"
          />
        </div>

        <div className="profile-field">
          <label>
            {t('locationSheet.taluk')}
          </label>

          <input
            type="text"
            value={locForm.taluk}
            onChange={(e) =>
              setLocForm((form) => ({
                ...form,
                taluk:
                  e.target.value,
              }))
            }
            placeholder="e.g. Mandya"
          />
        </div>

        <div className="profile-field">
          <label>
            {t('locationSheet.district')}
          </label>

          <input
            type="text"
            value={locForm.district}
            onChange={(e) =>
              setLocForm((form) => ({
                ...form,
                district:
                  e.target.value,
              }))
            }
            placeholder="e.g. Mandya"
          />
        </div>

        <div className="profile-field">
          <label>
            {t('locationSheet.state')}
          </label>

          <input
            type="text"
            value={locForm.state}
            onChange={(e) =>
              setLocForm((form) => ({
                ...form,
                state:
                  e.target.value,
              }))
            }
            placeholder="e.g. Karnataka"
          />
        </div>

        <div className="profile-sheet-actions">
          <button
            type="button"
            className="sticky-bar-secondary"
            onClick={() =>
              setLocationSheetOpen(false)
            }
          >
            {t('locationSheet.cancel')}
          </button>

          <button
            type="button"
            className="sticky-bar-primary"
            onClick={handleSaveLocation}
          >
            {t('locationSheet.save')}
          </button>
        </div>
      </BottomSheet>
    </AppShell>
  );
}