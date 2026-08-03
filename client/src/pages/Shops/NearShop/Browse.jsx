import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNearbyShops, getShopPricesForItem, getShopCountForItem } from '../../../services/nearShopService';
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
  const { showToast } = useToast();
  const { user } = useAuth();
  const { liveLocation } = useUserLocation();

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
    getBuyerLocation({ authenticatedUser: user, liveLocation }).then((loc) =>
      getNearbyShops({ query, buyerLat: loc.lat, buyerLng: loc.lng }).then((result) => {
        if (cancelled) return;
        setShops(result);
        setLoading(false);
      })
    );
    return () => {
      cancelled = true;
    };
  }, [query, user, liveLocation]);

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
    <AppShell title={t('shops:nearShop.title')} onBack={() => navigate('/')}>
      <div className="shop-intro">
        <p>{t('shops:nearShop.subtitle')}</p>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder={t('shops:nearShop.searchPlaceholder')} />

      <ChipScroller options={categoryOptions} activeId={category} onChange={setCategory} />

      <div className="shop-sec-head">
        <h4>{t('shops:nearShop.popular')} {t(`shops:categories.${category}`)}</h4>
        <span className="shop-lnk" onClick={() => showToast('Full catalog coming soon.')}>{t('shops:nearShop.viewAll')}</span>
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
        <button className="shop-filter-btn" onClick={() => showToast('Filters coming soon.')}>{t('shops:nearShop.filter')}</button>
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
                {shop.photoUrl ? <img src={shop.photoUrl} alt="" /> : '🏬'}
              </div>
              <div className="shop-card-info">
                <b>{shop.shopName}</b>
                <span>📍 {shop.location}</span>
                {shop.distanceKm != null && <span>{t('shops:nearShop.distanceAway', { km: shop.distanceKm.toFixed(1) })}</span>}
                {itemPrices[shop.id] != null && <span className="shop-item-price">₹{itemPrices[shop.id]}</span>}
              </div>
              <div className="shop-card-actions">
                <a className="shop-btn-call" href={`tel:${shop.phone || '9876543210'}`} onClick={(e) => e.stopPropagation()}>📞</a>
                <a
                  className="shop-btn-wa"
                  href={`https://wa.me/91${shop.phone || '9876543210'}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  💬
                </a>
                <button className="shop-btn-view" onClick={() => navigate(`/near-shop/${shop.id}`)}>{t('shops:nearShop.viewShop')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
