import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBrowseCrops } from '../../../services/buyCropsService';
import { getBuyerLocation, updateBuyerLocation } from '../../../services/buyerLocationService';
import { useAuth } from '../../../context/AuthContext';
import { reverseGeocode } from '../../../services/geocodingService';
import { buyCropsCategories, buyCropsSorts } from '../../../config/buyCropsConfig';
import { useToast } from '../../../context/ToastContext';
import AppShell from '../../../components/common/AppShell';
import SearchInput from '../../../components/common/SearchInput';
import ChipScroller from '../../../components/common/ChipScroller';
import OptionList from '../../../components/common/OptionList';
import BottomSheet from '../../../components/common/BottomSheet';
import './BuyCrops.css';

// Simplified on purpose: no Filter button/sheet anymore, only Sort -
// exactly 3 options (Nearest / Recently Updated / Price: Low to High),
// defaulting to Price: Low to High. Search and category chips unchanged.
export default function Browse() {
  const navigate = useNavigate();
  const { t } = useTranslation(['buyCrops', 'common']);
  const { showToast } = useToast();
  const { user } = useAuth();

  const [buyerLoc, setBuyerLoc] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('price_low');
  const [results, setResults] = useState([]);

  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [pendingGps, setPendingGps] = useState(null);
  const [locForm, setLocForm] = useState({ village: '', taluk: '', district: '', state: '' });

  async function loadLocation() {
    const loc = await getBuyerLocation({ authenticatedUser: user });
    setBuyerLoc(loc);
  }

  useEffect(() => {
    loadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function runSearch() {
    const list = await getBrowseCrops({
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

  const categoryOptions = buyCropsCategories.map((c) => ({ id: c.id, icon: c.icon, label: t(c.labelKey) }));
  const sortOptions = buyCropsSorts.map((s) => ({ id: s.id, label: t(s.labelKey) }));

  function handleClearFilters() {
    setQuery('');
    setCategory('All');
    setSort('price_low');
    showToast(t('filtersCleared'));
  }

  function openLocationSheet() {
    setLocForm({
      village: buyerLoc?.village ?? '',
      taluk: buyerLoc?.taluk ?? '',
      district: buyerLoc?.district ?? '',
      state: buyerLoc?.state ?? '',
    });
    setPendingGps(buyerLoc?.lat != null ? { lat: buyerLoc.lat, lng: buyerLoc.lng } : null);
    setGpsStatus(buyerLoc?.village ? 'geocoded' : 'idle');
    setLocationSheetOpen(true);
  }

  function handleUseGps() {
    if (!navigator.geolocation) {
      showToast(t('locationSheet.gpsUnavailable'));
      return;
    }
    setGpsStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPendingGps({ lat, lng });
        setGpsStatus('detected');

        const address = await reverseGeocode(lat, lng);
        if (address) {
          setLocForm((prev) => ({
            village: address.village || prev.village,
            taluk: address.taluk || prev.taluk,
            district: address.district || prev.district,
            state: address.state || prev.state,
          }));
          setGpsStatus('geocoded');
        } else {
          // Coordinates captured fine but the address lookup failed -
          // keep the "detected" state (never show raw coordinates) and
          // leave existing fields as-is for manual entry.
          setGpsStatus('detected');
        }
      },
      () => setGpsStatus('error')
    );
  }

  async function handleSaveLocation() {
    const label = [locForm.village, locForm.taluk, locForm.district].filter(Boolean).join(', ') || buyerLoc?.label;
    const updated = await updateBuyerLocation({
      village: locForm.village,
      taluk: locForm.taluk,
      district: locForm.district,
      state: locForm.state,
      label,
      lat: pendingGps?.lat ?? buyerLoc?.lat ?? null,
      lng: pendingGps?.lng ?? buyerLoc?.lng ?? null,
    });
    setBuyerLoc(updated);
    setLocationSheetOpen(false);
    showToast(t('locationSheet.saved'));
  }

  return (
    <AppShell
      title={t('title')}
      subtitle={buyerLoc ? `📍 ${buyerLoc.label}` : undefined}
      onBack={() => navigate('/')}
    >
      <div className="bc-intro">
        <h2>{t('title')}</h2>
        <p>{t('subtitle')}</p>
      </div>

      <div className="bc-locrow">
        <span className="pin">📍 {buyerLoc?.label}</span>
        <a onClick={openLocationSheet}>{t('changeLocation')}</a>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder={t('searchPlaceholder')} />

      <ChipScroller options={categoryOptions} activeId={category} onChange={setCategory} />

      <div className="bc-toolbar">
        <button onClick={() => setSortSheetOpen(true)}>↕ {t('sort')}</button>
      </div>

      <div className="bc-sec-head">
        <h4>{t('cropsNearYou')}</h4>
        <span>{t('resultsCount', { count: results.length })}</span>
      </div>

      {results.length === 0 ? (
        <div className="bc-empty">
          <span className="ic">🌾</span>
          <b>{t('emptyTitle')}</b>
          <p>{t('emptyBody')}</p>
          <div className="row">
            <button className="sticky-bar-secondary" onClick={handleClearFilters}>{t('clearFilters')}</button>
            <button className="sticky-bar-primary" onClick={handleClearFilters}>{t('viewAllCrops')}</button>
          </div>
        </div>
      ) : (
        <div>
          {results.map((l) => (
            <div className="bc-crop-card" key={l.id} onClick={() => navigate(`/buy/${l.id}`)}>
              <div className="bc-crop-top">
                <div className="bc-crop-thumb">
                  {l.photoUrl ? <img src={l.photoUrl} alt="" /> : l.cropIcon}
                </div>
                <div className="bc-crop-info">
                  <b>{l.itemName} <span className="bc-crop-kn">/ {l.cropKannadaName}</span></b>
                  <span className="bc-farmer">👨‍🌾 {l.farmerName}</span>
                  <span className="bc-loc">📍 {l.location || '—'}{l.distanceKm != null ? ` · ${l.distanceKm.toFixed(1)} km away` : ''}</span>
                </div>
                <span className="bc-avail-pill">{t('available')}</span>
              </div>
              <div className="bc-crop-mid">
                <div><span>{t('quantity')}</span><b>{l.quantity} {l.unit}</b></div>
                <div><span>{t('price')}</span><b>₹{l.price} / {l.unit}</b></div>
              </div>
              <div className="bc-updated">Updated {new Date(l.updatedAt).toLocaleDateString('en-IN')}</div>
              <div className="bc-crop-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn-view" onClick={() => navigate(`/buy/${l.id}`)}>{t('view')}</button>
                <a className="btn-call" href={`tel:${l.phone || '9876543210'}`}>{t('call')}</a>
                <a
                  className="btn-whatsapp"
                  href={`https://wa.me/91${l.phone || '9876543210'}?text=${encodeURIComponent(t('detail.whatsappMessage', { crop: l.itemName }))}`}
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
        <button className="sticky-bar-secondary cl-gps-btn" onClick={handleUseGps}>{t('locationSheet.useGps')}</button>
        <div className="bc-gps-result">
          {gpsStatus === 'capturing' && t('locationSheet.gpsCapturing')}
          {gpsStatus === 'detected' && t('locationSheet.gpsDetected')}
          {gpsStatus === 'geocoded' && `✓ ${[locForm.village, locForm.taluk, locForm.district].filter(Boolean).join(', ')}`}
          {gpsStatus === 'error' && t('locationSheet.gpsError')}
        </div>

        <div className="profile-field">
          <label>{t('locationSheet.village')}</label>
          <input value={locForm.village} onChange={(e) => setLocForm((f) => ({ ...f, village: e.target.value }))} placeholder="e.g. Keragodu" />
        </div>
        <div className="profile-field">
          <label>{t('locationSheet.taluk')}</label>
          <input value={locForm.taluk} onChange={(e) => setLocForm((f) => ({ ...f, taluk: e.target.value }))} placeholder="e.g. Mandya" />
        </div>
        <div className="profile-field">
          <label>{t('locationSheet.district')}</label>
          <input value={locForm.district} onChange={(e) => setLocForm((f) => ({ ...f, district: e.target.value }))} placeholder="e.g. Mandya" />
        </div>
        <div className="profile-field">
          <label>{t('locationSheet.state')}</label>
          <input value={locForm.state} onChange={(e) => setLocForm((f) => ({ ...f, state: e.target.value }))} placeholder="e.g. Karnataka" />
        </div>

        <div className="profile-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setLocationSheetOpen(false)}>{t('locationSheet.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleSaveLocation}>{t('locationSheet.save')}</button>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
