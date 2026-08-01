import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceholderPage from '../../components/common/PlaceholderPage';
import { useAuth } from '../../context/AuthContext';

export function NearShop() {
  return <PlaceholderPage icon="📍" titleKey="navigation:shops.nearShop" />;
}

// Manage Shop is a requiresAuth category. Same direct-URL guard as
// SellAnimals/SellCropLayout/Profile.
export function ManageShop() {
  const navigate = useNavigate();
  const { user, loading, openLoginModal } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate, openLoginModal]);

  if (!user) return null;
  return <PlaceholderPage icon="🏬" titleKey="navigation:shops.manageShop" />;
}
