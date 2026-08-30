import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNearbyShops, getShopPricesForItem, getShopCountForItem } from '../../../services/nearShopService';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { getBuyerLocation } from '../../../services/buyerLocationService';
import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';
import { useToast } from '../../../context/ToastContext';
import { shopProductCategories, getShopCatalogByCategory } from '../../../config/shopProductCatalog';
import AppShell from '../../../components/common/AppShell';
import SearchInput from '../../../components/common/SearchInput';
import ChipScroller from '../../../components/common/ChipScroller';
import './Shops.css';

export default function Browse() {
  const navigate = useNavigate();
  const { t } = useTranslation(['shops']);
  const { user } = useAuth();
  const { liveLocation, geocodedLocation } = useUserLocation();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('seeds');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemPrices, setItemPrices] = useState({});
  const [itemShopCount, setItemShopCount] = useState(0);

  const categoryOptions = shopProductCategories.map((c) => ({ id: c.id, icon: c.icon, label: t(`shops:categories.${c.id}`) }));
  const popularItems = useMemo(() => getShopCatalogByCategory(category), [category]);
  const selectedItem = useMemo(
    () => popularItems.find((i) => i.id === selectedItemId) ?? popularItems[0] ?? null,
    [popularItems, selectedItemId]
  );

  useEffect(() => {
    setSelectedItemId(popularItems[0]?.id ?? null);
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;

    async function loadShops() {
      setLoading(true);

      try {
        const loc = await getBuyerLocation({ authenticatedUser: user, liveLocation, geocodedLocation });
        const result = await getNearbyShops({ query, buyerLat: loc.lat, buyerLng: loc.lng });
        if (cancelled) return;
        setShops(result);
      } catch {
        if (cancelled) return;
        setShops([]);
        showToast(t('shops:nearShop.loadFailed', { defaultValue: 'Unable to load nearby shops.' }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadShops();

    return () => {
      cancelled = true;
    };
  }, [query, user, liveLocation, geocodedLocation, showToast, t]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedItem) {
      setItemPrices({});
      setItemShopCount(0);
      return;
    }
    Promise.all([getShopPricesForItem(selectedItem.id), getShopCountForItem(selectedItem.id)]).then(([prices, count]) => {
      if (cancelled) return;
      setItemPrices(prices);
      setItemShopCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedItem?.id]);

  return (
    <AppShell title={t('shops:nearShop.title')} onBack={() => navigate('/category/shops')}>
      <div className="shop-intro">
        <p>{t('shops:nearShop.subtitle')}</p>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder={t('shops:nearShop.searchPlaceholder')} />

      <ChipScroller options={categoryOptions} activeId={category} onChange={setCategory} />

      <div className="shop-sec-head">
        <h4>{t('shops:nearShop.popular')} {t(`shops:categories.${category}`)}</h4>
      </div>

      <div className="shop-item-row">
        {popularItems.map((item) => (
          <div
            key={item.id}
            className={`shop-item-card${item.id === selectedItemId ? ' active' : ''}`}
            onClick={() => setSelectedItemId(item.id)}
          >
            <span className="ii">{item.icon}</span>
            <b>{item.name}</b>
          </div>
        ))}
      </div>

      <div className="shop-nearby-head">
        <h4>{t('shops:nearShop.nearbyShops')}</h4>
      </div>

      {selectedItem && (
        <div className="shop-item-bar">
          <div>
            <b>{selectedItem.name}</b>
            <span>{t('shops:nearShop.availableAt', { count: itemShopCount })}</span>
          </div>
          <div className="ib-icon">{selectedItem.icon}</div>
        </div>
      )}

      {!loading && shops.length === 0 ? (
        <div className="shop-empty">
          <span className="ic">🗺️</span>
          <b>{t('shops:nearShop.emptyTitle')}</b>
          <p>{t('shops:nearShop.emptyBody')}</p>
        </div>
      ) : (
        <div className="shop-list">
          {shops.map((shop) => (
            <div className="shop-card" key={shop.id}>
              <div className="shop-card-thumb">
                {shop.photoUrl ? <img src={resolveImageUrl(shop.photoUrl)} alt="" /> : '🏬'}
              </div>
              <div className="shop-card-info">
                <b>{shop.shopName}</b>
                <span>📍 {shop.location}</span>
                {itemPrices[shop.id] != null && <span className="shop-item-price">₹{itemPrices[shop.id]}</span>}
              </div>
              <div className="shop-card-actions">
                {shop.phone && (
                  <>
                    <a className="shop-btn-call" href={`tel:${shop.phone}`} onClick={(e) => e.stopPropagation()}>📞</a>
                    <a
                      className="shop-btn-wa"
                      href={`https://wa.me/91${shop.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      💬
                    </a>
                  </>
                )}
                <button className="shop-btn-view" onClick={() => navigate(`/near-shop/${shop.id}`)}>{t('shops:nearShop.viewShop')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
