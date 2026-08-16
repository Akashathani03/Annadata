import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AppShell from '../../../components/common/AppShell';
import { useAuth } from '../../../context/AuthContext';
import {
  IconHome,
  IconListings,
  IconAdd,
} from '../../../components/icons';

// Sell Animal layout.
//
// This layout:
// 1. Protects the Sell Animal section behind authentication.
// 2. Shows the seller navigation on the dashboard.
// 3. Keeps Create Listing and My Listings available as separate routes.
// 4. Redirects unauthenticated users back to Home after opening login.
export default function SellAnimalsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { t } = useTranslation([
    'common',
    'navigation',
    'animals',
  ]);

  const {
    user,
    loading,
    openLoginModal,
  } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();

      navigate('/', {
        replace: true,
      });
    }
  }, [
    loading,
    user,
    navigate,
    openLoginModal,
  ]);

  const activeSegment = location.pathname.split('/')[2] ?? 'dashboard';

  const navItems = [
    {
      key: 'dashboard',
      icon: IconHome,
      label: t('common:dashboard'),
      route: '/sell-animal/dashboard',
    },
    {
      key: 'create',
      icon: IconAdd,
      label: t('navigation:animals.sellAnimal'),
      route: '/sell-animal/create',
    },
    {
      key: 'listings',
      icon: IconListings,
      label: t('animals:nav.myListings'),
      route: '/sell-animal/listings',
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <AppShell
      title={t('common:home')}
      onBack={() => navigate('/')}
      navItems={navItems}
      activeNavKey={activeSegment}
    >
      <Outlet />
    </AppShell>
  );
}