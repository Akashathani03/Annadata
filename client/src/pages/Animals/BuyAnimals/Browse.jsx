import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { getBrowseAnimals } from '../../../services/buyAnimalsService';
import {
  getBuyerLocation,
  updateBuyerLocation,
} from '../../../services/buyerLocationService';

import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { formatRelativeTime } from '../../../utils/formatDate';
import { formatDistanceKm } from '../../../utils/geo';

import ListingSkeleton from '../../../components/common/ListingSkeleton';
import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';
import { animalCategories } from '../../../config/animalCatalog';
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


// Buy Animal browsing screen.
//
// Uses the same browsing structure as Buy Crops:
// Search → Animal Category → Distance → Sort → Results.
//
// Location is buyer-specific and can be updated using GPS.
export default function Browse() {
  const navigate = useNavigate();

  const { t } = useTranslation([
    'buyCrops',
    'animals',
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

  /*
   * Load buyer location.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadLocation() {
      try {
        const loc = await getBuyerLocation({
          authenticatedUser: user,
          liveLocation,
          geocodedLocation,
        });

        if (cancelled) return;
        setBuyerLoc(loc);
      } catch {
        if (cancelled) return;
        setBuyerLoc(null);
      }
    }

    loadLocation();

    return () => {
      cancelled = true;
    };
  }, [user, liveLocation, geocodedLocation]);

  /*
   * Re-run search whenever browsing criteria change.
   */
  useEffect(() => {
    if (!buyerLoc) return;

    let cancelled = false;

    async function runSearch() {
      setSearchLoading(true);
      try {
        const list = await getBrowseAnimals({
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
        setResults(Array.isArray(list) ? list : []);
      } catch {
        if (cancelled) return;
        setResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
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
  ]);

  /*
   * Category options.
   */
  const categoryOptions = animalCategories.map(
    (categoryItem) => ({
      id: categoryItem.id,
      icon: categoryItem.icon,
      label: t(categoryItem.labelKey),
    })
  );

  /*
   * Sort options.
   */
  const sortOptions = buyCropsSorts.map(
    (sortItem) => ({
      id: sortItem.id,
      label: t(sortItem.labelKey),
    })
  );

  /*
   * Distance options.
   */
  const distanceOptions = buyCropsDistances.map(
    (km) => ({
      id: km,
      icon: '📍',
      label:
        km === 'All'
          ? t('distances.all')
          : t(`distances.within${km}`),
    })
  );

  /*
   * Reset search controls.
   */
  function handleClearFilters() {
    setQuery('');
    setCategory('All');
    setSort('price_low');
    setDistance('All');

    showToast(t('filtersCleared'));
  }

  /*
   * Open buyer location editor.
   */
  function openLocationSheet() {
    setLocationParts({
      village: buyerLoc?.village ?? '',
      taluk: buyerLoc?.taluk ?? '',
      district: buyerLoc?.district ?? '',
      state: buyerLoc?.state ?? '',
    });

    setCoords(
      buyerLoc?.lat != null
        ? {
            lat: buyerLoc.lat,
            lng: buyerLoc.lng,
          }
        : null
    );

    setLocationSheetOpen(true);
  }

  /*
   * Save manually entered / GPS location.
   */
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

      showToast(
        t('locationSheet.saved')
      );
    } catch {
      showToast(
        t(
          'common:somethingWentWrong',
          'Something went wrong. Please try again.'
        )
      );
    }
  }

  /*
   * Build WhatsApp link safely.
   */
  function getWhatsAppUrl(listing) {
    const phone = String(
      listing.phone || ''
    ).replace(/\D/g, '');

    const phoneWithCountryCode = phone.startsWith(
      '91'
    )
      ? phone
      : `91${phone}`;

    const message = encodeURIComponent(
      t('animals:detail.whatsappMessage', { item: listing.itemName })
    );

    return `https://wa.me/${phoneWithCountryCode}?text=${message}`;
  }

  return (
    <AppShell
      title={t(
        'animals:buyBrowse.browseTitle'
      )}
      onBack={() => navigate('/')}
    >
      {/* Buyer Location */}
      <div className="bc-locrow">
        <span className="pin">
          📍 {buyerLoc?.label || '—'}
        </span>

        <button
          type="button"
          onClick={openLocationSheet}
          style={{
            border: 'none',
            background: 'none',
            padding: 0,
            color: 'inherit',
            font: 'inherit',
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
          'animals:buyBrowse.searchPlaceholder'
        )}
      />

      {/* Animal Categories */}
      <ChipScroller
        options={categoryOptions}
        activeId={category}
        onChange={setCategory}
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
          onClick={() =>
            setSortSheetOpen(true)
          }
        >
          ↕ {t('sort')}
        </button>
      </div>

      {/* Results Header */}
      <div className="bc-sec-head">
        <h4>
          {t(
            'animals:buyBrowse.animalsNearYou'
          )}
        </h4>

        <span>
          {t('resultsCount', {
            count: results.length,
          })}
        </span>
      </div>

      {/* Results */}
      {searchLoading ? (
        <ListingSkeleton />
      ) : results.length === 0 ? (
        <div className="bc-empty">
          <span className="ic">🐄</span>

          <b>
            {t(
              'animals:buyBrowse.emptyTitle'
            )}
          </b>

          <p>
            {t(
              'animals:buyBrowse.emptyBody'
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
        <div>
          {results.map((listing) => (
            <div
              className="bc-crop-card"
              key={listing.id}
              onClick={() =>
                navigate(
                  `/buy-animal/${listing.id}`
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
                    listing.animalIcon || '🐄'
                  )}
                </div>

                <div className="bc-crop-info">
                  <b>
                    {listing.itemName}
                  </b>

                  <span className="bc-farmer">
                    👨‍🌾{' '}
                    {listing.sellerName ||
                      'Farmer'}
                  </span>

                  <span className="bc-loc">
                    📍{' '}
                    {listing.location || '—'}

                    {listing.distanceKm != null
                      ? ` · ${formatDistanceKm(listing.distanceKm)} km away`
                      : ''}
                  </span>
                </div>

                <span className="bc-avail-pill">
                  {listing.animalTypeName ||
                    t(
                      'animals:buyBrowse.animalType'
                    )}
                </span>
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
                      `/buy-animal/${listing.id}`
                    )
                  }
                >
                  {t('view')}
                </button>

                <a
                  className="btn-call"
                  href={`tel:${
                    listing.phone || ''
                  }`}
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {t('call')}
                </a>

                <a
                  className="btn-whatsapp"
                  href={getWhatsAppUrl(
                    listing
                  )}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {t('chat')}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sort Bottom Sheet */}
      <BottomSheet
        open={sortSheetOpen}
        onClose={() =>
          setSortSheetOpen(false)
        }
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

      {/* Location Bottom Sheet */}
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