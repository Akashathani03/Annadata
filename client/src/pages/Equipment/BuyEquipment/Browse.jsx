import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getBrowseEquipment } from '../../../services/buyEquipmentService';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { formatRelativeTime } from '../../../utils/formatDate';
import {
  getBuyerLocation,
  updateBuyerLocation,
} from '../../../services/buyerLocationService';

import ListingSkeleton from '../../../components/common/ListingSkeleton';
import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';
import {
  buyCropsSorts,
  buyCropsDistances,
} from '../../../config/buyCropsConfig';
import { useToast } from '../../../context/ToastContext';

import AppShell from '../../../components/common/AppShell';
import SearchInput from '../../../components/common/SearchInput';
import ChipScroller from '../../../components/common/ChipScroller';
import OptionList from '../../../components/common/OptionList';
import GpsLocationSection from '../../../components/common/GpsLocationSection';
import BottomSheet from '../../../components/common/BottomSheet';

import '../../Crops/BuyCrops/BuyCrops.css';


export default function Browse() {
  const navigate = useNavigate();

  const { t } = useTranslation([
    'buyCrops',
    'equipment',
    'common',
  ]);

  const { showToast } = useToast();
  const { user } = useAuth();
  const { liveLocation, geocodedLocation } = useUserLocation();

  const [buyerLoc, setBuyerLoc] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('nearest');
  const [distance, setDistance] = useState('All');
  const [searchLoading, setSearchLoading] = useState(true);
  const [results, setResults] = useState([]);

  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);

  const [locationParts, setLocationParts] = useState({
    village: '',
    taluk: '',
    district: '',
    state: '',
  });

  const [coords, setCoords] = useState(null);


  /* ---------------- LOCATION ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadLocation() {
      try {
        const loc = await getBuyerLocation({
          authenticatedUser: user,
          liveLocation,
          geocodedLocation,
        });

        if (!cancelled) {
          setBuyerLoc(loc);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            '[Equipment Browse] Failed to load buyer location:',
            error
          );
        }

        if (!cancelled) {
          setBuyerLoc(null);
        }
      }
    }

    loadLocation();

    return () => {
      cancelled = true;
    };
  }, [user, liveLocation, geocodedLocation]);


  /* ---------------- SEARCH ---------------- */

  useEffect(() => {
    if (!buyerLoc) return;

    let cancelled = false;

    async function runSearch() {
      if (!cancelled) setSearchLoading(true);
      try {
        const list = await getBrowseEquipment({
          query,
          sort,
          filters: {
            distance,
          },
          buyerLat: buyerLoc?.lat,
          buyerLng: buyerLoc?.lng,
        });

        if (!cancelled) {
          setResults(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(
            '[Equipment Browse] Failed to load equipment:',
            error
          );
        }

        if (!cancelled) {
          setResults([]);
        }
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
  }, [buyerLoc, query, sort, distance]);


  /* ---------------- OPTIONS ---------------- */

  const sortOptions = buyCropsSorts.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
  }));

  const distanceOptions = buyCropsDistances.map((km) => ({
    id: km,
    icon: '📍',
    label:
      km === 'All'
        ? t('distances.all')
        : t(`distances.within${km}`),
  }));


  /* ---------------- CLEAR ---------------- */

  function handleClearFilters() {
    setQuery('');
    setSort('nearest');
    setDistance('All');

    showToast(t('filtersCleared'));
  }


  /* ---------------- LOCATION SHEET ---------------- */

  function openLocationSheet() {
    setLocationParts({
      village: buyerLoc?.village ?? '',
      taluk: buyerLoc?.taluk ?? '',
      district: buyerLoc?.district ?? '',
      state: buyerLoc?.state ?? '',
    });

    setCoords(
      buyerLoc?.lat != null && buyerLoc?.lng != null
        ? {
            lat: buyerLoc.lat,
            lng: buyerLoc.lng,
          }
        : null
    );

    setLocationSheetOpen(true);
  }


  async function handleSaveLocation() {
    try {
      const label =
        [
          locationParts.village,
          locationParts.taluk,
          locationParts.district,
        ]
          .filter(Boolean)
          .join(', ') ||
        buyerLoc?.label ||
        '';

      const updated = await updateBuyerLocation({
        village: locationParts.village,
        taluk: locationParts.taluk,
        district: locationParts.district,
        state: locationParts.state,
        label,
        lat: coords?.lat ?? buyerLoc?.lat ?? null,
        lng: coords?.lng ?? buyerLoc?.lng ?? null,
      });

      setBuyerLoc(updated);
      setLocationSheetOpen(false);

      showToast(t('locationSheet.saved'));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          '[Equipment Browse] Failed to save location:',
          error
        );
      }

      showToast(
        t('locationSheet.saveFailed', {
          defaultValue: 'Could not save location. Please try again.',
        })
      );
    }
  }


  /* ---------------- WHATSAPP ---------------- */

  function getWhatsAppUrl(listing) {
    const phone = String(listing.phone || '').replace(/\D/g, '');
    if (!phone) return null;

    const message = encodeURIComponent(
      `Hello, I found your ${listing.itemName} listing on Annadata. Is it still available?`
    );

    return `https://wa.me/91${phone}?text=${message}`;
  }


  /* ---------------- UI ---------------- */

  return (
    <AppShell
      title={t('equipment:buyBrowse.browseTitle')}
      onBack={() => navigate('/category/equipment')}
    >

      {/* Location */}
      <div className="bc-locrow">
        <span className="pin">
          📍 {buyerLoc?.label || 'Location not set'}
        </span>

        <button
          type="button"
          onClick={openLocationSheet}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--green-dark)',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {t('changeLocation')}
        </button>
      </div>


      {/* Search */}
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t(
          'equipment:buyBrowse.searchPlaceholder'
        )}
      />


      {/* Distance */}
      <ChipScroller
        options={distanceOptions}
        activeId={distance}
        onChange={setDistance}
      />


      {/* Sort */}
      <div className="bc-toolbar">
        <button
          type="button"
          onClick={() => setSortSheetOpen(true)}
        >
          ↕ {t('sort')}
        </button>
      </div>


      {/* Section Header */}
      <div className="bc-sec-head">
        <h4>
          {t(
            'equipment:buyBrowse.equipmentNearYou'
          )}
        </h4>
      </div>


      {/* Empty State */}
      {searchLoading ? (
        <ListingSkeleton />
      ) : results.length === 0 ? (
        <div className="bc-empty">
          <span className="ic">🚜</span>

          <b>
            {t(
              'equipment:buyBrowse.emptyTitle'
            )}
          </b>

          <p>
            {t(
              'equipment:buyBrowse.emptyBody'
            )}
          </p>

          <div className="row">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={handleClearFilters}
            >
              {t('clearFilters')}
            </button>
          </div>
        </div>
      ) : (

        /* Equipment Results */
        <div>
          {results.map((listing) => (
            <div
              className="bc-crop-card"
              key={listing.id}
              onClick={() =>
                navigate(
                  `/buy-equipment/${listing.id}`
                )
              }
            >

              {/* Top */}
              <div className="bc-crop-top">

                <div className="bc-crop-thumb">
                  {listing.photoUrls?.[0] ? (
                    <img
                      src={resolveImageUrl(
                        listing.photoUrls[0]
                      )}
                      alt=""
                    />
                  ) : (
                    listing.equipmentIcon || '🚜'
                  )}
                </div>


                <div className="bc-crop-info">

                  <b>
                    {listing.itemName}
                  </b>

                  <span className="bc-farmer">
                    👨‍🌾 {listing.sellerName || 'Seller'}
                  </span>

                  <span className="bc-loc">
                    📍 {listing.location || '—'}
                  </span>

                  {listing.condition && (
                    <span className="bc-loc">
                      {t(
                        'equipment:detail.condition'
                      )}
                      :{' '}
                      {t(
                        `equipment:condition.${listing.condition}`,
                        {
                          defaultValue:
                            listing.condition,
                        }
                      )}
                    </span>
                  )}

                </div>


                {listing.equipmentTypeName && (
                  <span className="bc-avail-pill">
                    {listing.equipmentTypeName}
                  </span>
                )}

              </div>


              {/* Price / Posted */}
              <div className="bc-crop-mid">

                <div>
                  <span>Price</span>
                  <b>
                    ₹
                    {Number(
                      listing.price || 0
                    ).toLocaleString('en-IN')}
                  </b>
                </div>

                <div>
                  <span>Posted</span>
                  <b>
                    {listing.createdAt
                      ? formatRelativeTime(
                          listing.createdAt
                        )
                      : '—'}
                  </b>
                </div>

              </div>


              {/* Actions */}
              <div
                className="bc-crop-actions"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                <button
                  type="button"
                  className="btn-view"
                  onClick={() =>
                    navigate(
                      `/buy-equipment/${listing.id}`
                    )
                  }
                >
                  {t('view')}
                </button>


                {listing.phone ? (
                  <>
                    <a className="btn-call" href={`tel:${listing.phone}`}>
                      {t('call')}
                    </a>

                    <a
                      className="btn-whatsapp"
                      href={getWhatsAppUrl(listing)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('chat')}
                    </a>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn-call" disabled>
                      {t('call')}
                    </button>

                    <button type="button" className="btn-whatsapp" disabled>
                      {t('chat')}
                    </button>
                  </>
                )}

              </div>

            </div>
          ))}
        </div>
      )}


      {/* Sort Sheet */}
      <BottomSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
      >
        <h3>
          {t('sortSheet.title')}
        </h3>

        <OptionList
          options={sortOptions}
          activeId={sort}
          onChange={(id) => {
            setSort(id);
            setSortSheetOpen(false);
          }}
        />
      </BottomSheet>


      {/* Location Sheet */}
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

        <GpsLocationSection
          locationParts={locationParts}
          onLocationPartsChange={
            setLocationParts
          }
          coords={coords}
          onCoordsChange={setCoords}
        />

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