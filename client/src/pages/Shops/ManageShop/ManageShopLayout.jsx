import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../../components/common/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { IconHome, IconShop, IconPackage, IconChat, IconProfile } from '../../../components/icons';

const TITLE_KEY_BY_PATH = {
  dashboard: 'shops:manage.dashboard',
  myshop: 'shops:manage.myShop',
  products: 'shops:manage.products',
  enquiries: 'shops:manage.enquiries',
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
    { key: 'enquiries', icon: IconChat, label: t('shops:manage.enquiries'), route: '/shop-owner/enquiries' },
    { key: 'profile', icon: IconProfile, label: t('common:profile'), route: '/profile' },
  ];

  if (!user) return null;

  return (
    <AppShell
      title={t(TITLE_KEY_BY_PATH[activeSegment] ?? 'shops:manage.dashboard')}
      onBack={() => navigate(activeSegment === 'dashboard' ? '/' : '/shop-owner/dashboard')}
      navItems={navItems}
      activeNavKey={activeSegment}
    >
      <Outlet />
    </AppShell>
  );
}
