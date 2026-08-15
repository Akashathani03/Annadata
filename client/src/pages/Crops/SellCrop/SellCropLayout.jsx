import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../../components/common/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { IconListings, IconAdd } from '../../../components/icons';

export default function SellCropLayout() {
  const navigate = useNavigate();

  const { t } = useTranslation([
    'common',
    'navigation',
    'listings',
  ]);

  const {
    user,
    loading,
    openLoginModal,
  } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [
    loading,
    user,
    navigate,
    openLoginModal,
  ]);

  const navItems = [
    {
      key: 'create',
      icon: IconAdd,
      label: t('navigation:crops.sellCrop'),
      route: '/sell/create',
    },
    {
      key: 'listings',
      icon: IconListings,
      label: t('listings:nav.myListings'),
      route: '/sell/listings',
    },
  ];

  /*
   * Do not render anything while authentication is being resolved.
   * This prevents the Sell Crop UI from briefly appearing before
   * the auth guard redirects an unauthenticated user.
   */
  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell
      title={t('common:home')}
      onBack={() => navigate('/')}
      navItems={navItems}
    >
      <Outlet />
    </AppShell>
  );
}