import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../../components/common/AppShell';
import { useAuth } from '../../../context/AuthContext';
import { IconHome, IconListings, IconAdd } from '../../../components/icons';

// Same architecture and reasoning as SellCropLayout/SellAnimalsLayout -
// wraps only the dashboard route, create/listings/listings/:id are
// independent top-level routes with their own AppShell each.
export default function SellEquipmentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common', 'navigation', 'equipment']);
  const { user, loading, openLoginModal } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate, openLoginModal]);

  const activeSegment = location.pathname.split('/')[2] ?? 'dashboard';

  const navItems = [
    { key: 'dashboard', icon: IconHome, label: t('common:dashboard'), route: '/sell-equipment/dashboard' },
    { key: 'create', icon: IconAdd, label: t('navigation:equipment.sellEquipment'), route: '/sell-equipment/create' },
    { key: 'listings', icon: IconListings, label: t('equipment:nav.myListings'), route: '/sell-equipment/listings' },
  ];

  if (!user) return null;

  return (
    <AppShell title={t('common:home')} onBack={() => navigate('/category/equipment')} navItems={navItems} activeNavKey={activeSegment}>
      <Outlet />
    </AppShell>
  );
}
