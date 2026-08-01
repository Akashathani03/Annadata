import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../../components/common/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { IconHome, IconListings, IconAdd, IconChat, IconProfile } from '../../../components/icons';

const TITLE_KEY_BY_PATH = {
  dashboard: 'common:home',
  create: 'navigation:crops.sellCrop',
  listings: 'listings:nav.myListings',
  enquiries: 'listings:nav.enquiries',
  sales: 'listings:salesScreen.title',
  profile: 'common:profile',
};

// This whole subtree requires auth (Sell Crop is a requiresAuth
// category). Guarding once here, rather than in every leaf screen,
// covers direct-URL navigation too.
export default function SellCropLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'navigation', 'listings']);
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
    { key: 'listings', icon: IconListings, label: t('listings:nav.myListings'), route: '/sell/listings' },
    { key: 'create', icon: IconAdd, label: t('navigation:crops.sellCrop'), route: '/sell/create' },
    { key: 'enquiries', icon: IconChat, label: t('listings:nav.enquiries'), route: '/sell/enquiries' },
    { key: 'profile', icon: IconProfile, label: t('common:profile'), route: '/profile' },
  ];

  function handleBack() {
    if (activeSegment === 'dashboard') navigate('/');
    else navigate('/sell/dashboard');
  }

  if (!user) return null;

  return (
    <AppShell
      title={t(TITLE_KEY_BY_PATH[activeSegment] ?? 'navigation:crops.sellCrop')}
      subtitle={activeSegment === 'dashboard' ? user.location : undefined}
      onBack={handleBack}
      navItems={isCreate ? undefined : navItems}
      activeNavKey={activeSegment}
    >
      <Outlet />
    </AppShell>
  );
}
