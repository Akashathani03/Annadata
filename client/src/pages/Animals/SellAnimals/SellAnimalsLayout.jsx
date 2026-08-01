import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../../components/common/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { IconHome, IconListings, IconAdd, IconChat, IconProfile } from '../../../components/icons';

const TITLE_KEY_BY_PATH = {
  dashboard: 'common:home',
  create: 'navigation:animals.sellAnimal',
  listings: 'animals:nav.myListings',
  enquiries: 'animals:nav.enquiries',
  profile: 'common:profile',
};

// Same requiresAuth subtree-guard pattern as SellCropLayout - Sell
// Animals is a requiresAuth category (see marketplaceCategories.js).
export default function SellAnimalsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'navigation', 'animals']);
  const { user, loading, openLoginModal } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate, openLoginModal]);

  const activeSegment = location.pathname.split('/')[2] ?? 'dashboard';
  const isCreate = activeSegment === 'create';

  const navItems = [
    { key: 'dashboard', icon: IconHome, label: t('common:home'), route: '/' },
    { key: 'listings', icon: IconListings, label: t('animals:nav.myListings'), route: '/sell-animal/listings' },
    { key: 'create', icon: IconAdd, label: t('navigation:animals.sellAnimal'), route: '/sell-animal/create' },
    { key: 'enquiries', icon: IconChat, label: t('animals:nav.enquiries'), route: '/sell-animal/enquiries' },
    { key: 'profile', icon: IconProfile, label: t('common:profile'), route: '/profile' },
  ];

  function handleBack() {
    if (activeSegment === 'dashboard') navigate('/');
    else navigate('/sell-animal/dashboard');
  }

  if (!user) return null;

  return (
    <AppShell
      title={t(TITLE_KEY_BY_PATH[activeSegment] ?? 'navigation:animals.sellAnimal')}
      subtitle={activeSegment === 'dashboard' ? user.location : undefined}
      onBack={handleBack}
      navItems={isCreate ? undefined : navItems}
      activeNavKey={activeSegment}
    >
      <Outlet />
    </AppShell>
  );
}
