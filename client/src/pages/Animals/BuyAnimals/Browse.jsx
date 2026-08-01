import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBrowseAnimals } from '../../../services/buyAnimalsService';
import { getBuyerLocation, updateBuyerLocation } from '../../../services/buyerLocationService';
import { useAuth } from '../../../context/AuthContext';
import { animalCategories } from '../../../config/animalCatalog';
import { buyCropsSorts } from '../../../config/buyCropsConfig';
import { useToast } from '../../../context/ToastContext';
import AppShell from '../../../components/common/AppShell';
import SearchInput from '../../../components/common/SearchInput';
import ChipScroller from '../../../components/common/ChipScroller';
import OptionList from '../../../components/common/OptionList';
import GpsLocationSection from '../../../components/common/GpsLocationSection';
import BottomSheet from '../../../components/common/BottomSheet';
import '../../Crops/BuyCrops/BuyCrops.css';

// Simplified identically to Buy Crops: no Filter button/sheet, only
// Sort - same 3 options (reused directly from buyCropsConfig, so both
// modules behave identically by construction, not by convention),
// defaulting to Price: Low to High.
export default function Browse() {
  const navigate = useNavigate();
  const { t } = useTranslation(['buyCrops', 'animals', 'common']);
  const { showToast } = useToast();
  const { user } = useAuth();

  const [buyerLoc, setBuyerLoc] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('price_low');
  const [results, setResults] = useState([]);

  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [locationParts, setLocationParts] = useState({ village: '', taluk: '', district: '', state: '' });
  const [coords, setCoords] = useState(null);

  async function loadLocation() {
    const loc = await getBuyerLocation({ authenticatedUser: user });
    setBuyerLoc(loc);
  }

  useEffect(() => {
    loadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function runSearch() {
    const list = await getBrowseAnimals({
      query,
      category,
      sort,
      buyerLat: buyerLoc?.lat,
      buyerLng: buyerLoc?.lng,
    });
    setResults(list);
  }

  useEffect(() => {
    if (buyerLoc) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerLoc, query, category, sort]);

  const categoryOptions = animalCategories.map((c) => ({ id: c.id, icon: c.icon, label: t(c.labelKey) }));
  const sortOptions = buyCropsSorts.map((s) => ({ id: s.id, label: t(s.labelKey) }));

  function handleClearFilters() {
    setQuery('');
    setCategory('All');
    setSort('price_low');
    showToast(t('filtersCleared'));
  }

  function openLocationSheet() {
    setLocationParts({
      village: buyerLoc?.village ?? '',
      taluk: buyerLoc?.taluk ?? '',
      district: buyerLoc?.district ?? '',
      state: buyerLoc?.state ?? '',
    });
    setCoords(buyerLoc?.lat != null ? { lat: buyerLoc.lat, lng: buyerLoc.lng } : null);
    setLocationSheetOpen(true);
  }

  async function handleSaveLocation() {
    const label = [locationParts.village, locationParts.taluk, locationParts.district].filter(Boolean).join(', ') || buyerLoc?.label;
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
  }

  return (
    <AppShell
      title={t('animals:buyBrowse.browseTitle')}
      subtitle={buyerLoc ? `📍 ${buyerLoc.label}` : undefined}
      onBack={() => navigate('/')}
    >
      <div className="bc-locrow">
        <span className="pin">📍 {buyerLoc?.label}</span>
        <a onClick={openLocationSheet}>{t('changeLocation')}</a>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder={t('animals:buyBrowse.searchPlaceholder')} />

      <ChipScroller options={categoryOptions} activeId={category} onChange={setCategory} />

      <div className="bc-toolbar">
        <button onClick={() => setSortSheetOpen(true)}>↕ {t('sort')}</button>
      </div>

      <div className="bc-sec-head">
        <h4>{t('animals:buyBrowse.animalsNearYou')}</h4>
        <span>{t('resultsCount', { count: results.length })}</span>
      </div>

      {results.length === 0 ? (
        <div className="bc-empty">
          <span className="ic">🐄</span>
          <b>{t('animals:buyBrowse.emptyTitle')}</b>
          <p>{t('animals:buyBrowse.emptyBody')}</p>
          <div className="row">
            <button className="sticky-bar-secondary" onClick={handleClearFilters}>{t('clearFilters')}</button>
          </div>
        </div>
      ) : (
        <div>
          {results.map((l) => (
            <div className="bc-crop-card" key={l.id} onClick={() => navigate(`/buy-animal/${l.id}`)}>
              <div className="bc-crop-top">
                <div className="bc-crop-thumb">
                  {l.photoUrl ? <img src={l.photoUrl} alt="" /> : l.animalIcon}
                </div>
                <div className="bc-crop-info">
                  <b>{l.itemName}</b>
                  <span className="bc-farmer">👨‍🌾 {l.sellerName}</span>
                  <span className="bc-loc">📍 {l.location || '—'}{l.distanceKm != null ? ` · ${l.distanceKm.toFixed(1)} km away` : ''}</span>
                </div>
                <span className="bc-avail-pill">{l.animalTypeName}</span>
              </div>
              <div className="bc-crop-mid">
                <div><span>Price</span><b>₹{l.price}</b></div>
                <div><span>Posted</span><b>{new Date(l.createdAt).toLocaleDateString('en-IN')}</b></div>
              </div>
              <div className="bc-crop-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn-view" onClick={() => navigate(`/buy-animal/${l.id}`)}>{t('view')}</button>
                <a className="btn-call" href={`tel:${l.phone || '9876543210'}`}>{t('call')}</a>
                <a
                  className="btn-whatsapp"
                  href={`https://wa.me/91${l.phone || '9876543210'}?text=${encodeURIComponent(`Hello, I found your ${l.itemName} listing on Annadata. Is it still available?`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('chat')}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={sortSheetOpen} onClose={() => setSortSheetOpen(false)}>
        <h3>{t('sortSheet.title')}</h3>
        <OptionList
          options={sortOptions}
          activeId={sort}
          onChange={(id) => { setSort(id); setSortSheetOpen(false); }}
        />
      </BottomSheet>

      <BottomSheet open={locationSheetOpen} onClose={() => setLocationSheetOpen(false)}>
        <h3>{t('locationSheet.title')}</h3>
        <p>{t('locationSheet.subtitle')}</p>
        <GpsLocationSection
          locationParts={locationParts}
          onLocationPartsChange={setLocationParts}
          coords={coords}
          onCoordsChange={setCoords}
        />
        <div className="profile-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setLocationSheetOpen(false)}>{t('locationSheet.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleSaveLocation}>{t('locationSheet.save')}</button>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
