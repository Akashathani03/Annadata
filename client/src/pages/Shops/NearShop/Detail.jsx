import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getShopDetail } from '../../../services/nearShopService';
import { resolveImageUrl } from '../../../utils/resolveImageUrl';
import { getBuyerLocation } from '../../../services/buyerLocationService';
import { shopProductCategories } from '../../../config/shopProductCatalog';
import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';
import AppShell from '../../../components/common/AppShell';
import ChipScroller from '../../../components/common/ChipScroller';
import ContactButtons from '../../../components/common/ContactButtons';
import './Shops.css';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['shops', 'common']);
  const { user } = useAuth();
  const { liveLocation } = useUserLocation();
  const [shop, setShop] = useState(undefined);
  const [activeCategory, setActiveCategory] = useState('seeds');

  useEffect(() => {
    let cancelled = false;
    getBuyerLocation({ authenticatedUser: user, liveLocation }).then((loc) =>
      getShopDetail(id, { buyerLat: loc.lat, buyerLng: loc.lng }).then((result) => {
        if (!cancelled) setShop(result);
      })
    );
    return () => {
      cancelled = true;
    };
  }, [id, user, liveLocation]);

  if (shop === undefined) {
    return (
      <AppShell title={t('shops:nearShop.title')} onBack={() => navigate('/near-shop')}>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('common:loading')}</p>
      </AppShell>
    );
  }

  if (shop === null) {
    return (
      <AppShell title={t('shops:nearShop.title')} onBack={() => navigate('/near-shop')}>
        <p style={{ padding: 16, color: 'var(--muted)' }}>{t('shops:detail.notAvailable')}</p>
      </AppShell>
    );
  }

  const categoriesWithProducts = shopProductCategories.filter((c) =>
    shop.products.some((p) => p.category === c.id)
  );
  const categoryOptions = categoriesWithProducts.map((c) => ({ id: c.id, icon: c.icon, label: t(`shops:categories.${c.id}`) }));
  const visibleProducts = shop.products.filter((p) => p.category === activeCategory);

  return (
    <AppShell
      title={shop.shopName}
      onBack={() => navigate('/near-shop')}
      stickyBar={
        shop.phone && (
          <ContactButtons
            phone={shop.phone}
            message={`Hello, I found ${shop.shopName} on Annadata.`}
            callLabel={`📞 ${t('shops:detail.call')}`}
            whatsappLabel={`💬 ${t('shops:detail.chatWhatsapp')}`}
            size="large"
          />
        )
      }
    >
      <div className="shop-detail-hero">
        {shop.photoUrl ? <img src={resolveImageUrl(shop.photoUrl)} alt="" /> : <span>🏬</span>}
      </div>

      <h2 style={{ margin: '0 0 6px', fontSize: 19 }}>{shop.shopName}</h2>
      <p style={{ margin: '0 0 4px', color: 'var(--muted)', fontSize: 13 }}>📍 {shop.location}</p>
      {shop.address && <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: 12.5 }}>{shop.address}</p>}

      <div className="shop-stats-row">
        <div className="shop-stat">
          <div className="si">📍</div>
          <b>{shop.distanceKm != null ? `${shop.distanceKm.toFixed(1)} km` : '—'}</b>
          <span>{t('shops:detail.distance')}</span>
        </div>
        <div className="shop-stat">
          <div className="si">🛍️</div>
          <b>{shop.products.length}</b>
          <span>{t('shops:detail.products')}</span>
        </div>
      </div>

      <div className="shop-sec-head">
        <h4>{t('shops:detail.productsAvailable')}</h4>
      </div>

      {categoryOptions.length > 0 && (
        <ChipScroller options={categoryOptions} activeId={activeCategory} onChange={setActiveCategory} />
      )}

      <div className="shop-product-grid">
        {visibleProducts.map((p) => (
          <div className="shop-product-card" key={p.id}>
            <div className="ic">🛍️</div>
            <b>{p.name}</b>
            <span>₹{p.price}</span>
            <span className={`avail-pill${p.availability === 'Out of Stock' ? ' out' : ''}`}>{p.availability}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 80 }} />
    </AppShell>
  );
}
