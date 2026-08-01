import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyShop } from '../../../services/shopsService';
import { getMyProducts } from '../../../services/shopProductsService';
import { getTodaySales } from '../../../services/shopSalesService';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/common/StatCard';
import './ManageShop.css';

export default function Dashboard() {
  const { t } = useTranslation(['shops']);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyShop(user.id).then((shopResult) => {
      if (cancelled) return;
      setShop(shopResult);
      if (shopResult) {
        Promise.all([getMyProducts(shopResult.id), getTodaySales(shopResult.id)]).then(([p, s]) => {
          if (cancelled) return;
          setProducts(p);
          setTodaySales(s);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (shop === undefined) return null;

  const inStock = products.filter((p) => p.availability === 'In Stock').length;
  const outStock = products.filter((p) => p.availability === 'Out of Stock').length;

  return (
    <div className="som-page">
      <div className="som-sec-title">{t('shops:manage.yourShop')}</div>
      <div className="som-card som-shop-status-card">
        <div>
          <b>{shop?.shopName || t('shops:manage.shopNotSetUp')}</b>
          <span className="som-sub">
            {shop?.status === 'active' ? t('shops:manage.statusActive') : t('shops:manage.statusIncomplete')}
          </span>
        </div>
        <button className="som-btn-sm" onClick={() => navigate('/shop-owner/myshop')}>{t('shops:manage.setUp')}</button>
      </div>

      <div className="som-sec-title">{t('shops:manage.products')}</div>
      <div className="som-stat-row">
        <StatCard label={t('shops:manage.totalProducts')} value={products.length} />
        <StatCard label={t('shops:manage.inStock')} value={inStock} />
        <StatCard label={t('shops:manage.outOfStock')} value={outStock} />
      </div>

      <div className="som-sec-title">{t('shops:manage.shopViews')}</div>
      <div className="som-stat-row">
        <StatCard label={t('shops:manage.shopViews')} value={shop?.views || 0} icon="👁" />
        <StatCard label={t('shops:manage.enquiriesCount')} value={0} icon="💬" />
      </div>

      <div className="som-sec-title">{t('shops:manage.todaysSales')}</div>
      {todaySales.length === 0 ? (
        <div className="som-card"><span className="som-sub">{t('shops:manage.noSalesYet')}</span></div>
      ) : (
        todaySales.map((s) => (
          <div className="som-card" key={s.id}>
            <div><b>{s.productName}</b><span className="som-sub">{t('shops:manage.quantitySold')}: {s.quantity}</span></div>
          </div>
        ))
      )}
    </div>
  );
}
