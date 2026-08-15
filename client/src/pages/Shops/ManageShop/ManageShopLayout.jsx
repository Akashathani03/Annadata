import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../../components/common/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { resolveBackRoute } from '../../../utils/navigationPolicy';
import { IconHome, IconShop, IconPackage, IconProfile } from '../../../components/icons';

const TITLE_KEY_BY_PATH = {
  dashboard: 'shops:manage.dashboard',
  myshop: 'shops:manage.myShop',
  products: 'shops:manage.products',
};

// Same declarative policy pattern as the other two modules - Manage
// Shop has no drill-down/detail routes today, so every segment simply
// backs out to dashboard, but this stays consistent with Sell Crop
// and Sell Animals rather than being a one-off inline expression.
const BACK_POLICY = {
  homeRoute: '/',
  defaultSegment: 'dashboard',
  parents: {
    myshop: '/shop-owner/dashboard',
    products: '/shop-owner/dashboard',
  },
};

// Same requiresAuth subtree-guard pattern as SellCropLayout - Manage
// Shop is a requiresAuth category (see marketplaceCategories.js).
export default function ManageShopLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['shops', 'common']);
  const { user, loading, openLoginModal } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate, openLoginModal]);

  const activeSegment = location.pathname.split('/')[2] ?? 'dashboard';

  const navItems = [
    { key: 'dashboard', icon: IconHome, label: t('shops:manage.dashboard'), route: '/shop-owner/dashboard' },
    { key: 'myshop', icon: IconShop, label: t('shops:manage.myShop'), route: '/shop-owner/myshop' },
    { key: 'products', icon: IconPackage, label: t('shops:manage.products'), route: '/shop-owner/products' },
    { key: 'profile', icon: IconProfile, label: t('common:profile'), route: '/profile' },
  ];

  if (!user) return null;

  return (
    <AppShell
      title={t(TITLE_KEY_BY_PATH[activeSegment] ?? 'shops:manage.dashboard')}
      onBack={() => navigate(resolveBackRoute(location.pathname, BACK_POLICY))}
      navItems={navItems}
      activeNavKey={activeSegment}
    >
      <Outlet />
    </AppShell>
  );
}
