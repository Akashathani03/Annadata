import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { marketplaceCategories } from '../../config/marketplaceCategories';
import { useAuth } from '../../context/AuthContext';
import { useUserLocation } from '../../context/LocationContext';
import WeatherCard from '../../components/weather/WeatherCard';
import Footer from '../../components/common/Footer';
import { IconProfile } from '../../components/icons';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import './Home.css';

// Navigation logic is unchanged from the approved category-based IA -
// this file only adds header branding and restyles the same 5 tiles
// to match the prototype's feature-card visual language.
export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation(['navigation', 'common', 'auth']);
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.profilePhotoUrl]);

  function openCategory(category) {
    navigate(category.hasMenu ? `/category/${category.key}` : category.route);
  }

  // Weather is guest-accessible - falls back to a neutral default
  // location when no one's logged in, or a logged-in user skipped
  // location setup. useUserLocation already resolves live GPS (this
  // session) over the profile location over the default, so this
  // component doesn't need to know which source won.
  const {
    lat: weatherLat,
    lng: weatherLng,
    refreshIfStale,
  } = useUserLocation();

  // Home becoming active is the trigger point for a staleness check -
  // reuses the current session location if still fresh, silently
  // re-requests GPS only if it's aged past the configurable threshold.
  // No prompt, no visible "refreshing" state, no manual control.
  useEffect(() => {
    try {
      Promise.resolve(refreshIfStale()).catch(() => {
        // Location refresh is optional on Home.
        // Keep using the existing/profile/default location if it fails.
      });
    } catch {
      // Protect Home from an unexpected synchronous location error.
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-logo">
          <div className="home-logo-badge">🌾</div>

          <div>
            <h1>{t('common:appName')}</h1>
            <p>{t('common:tagline')}</p>
          </div>
        </div>

        <div className="home-header-right">
          {isAuthenticated ? (
            <button
              className="home-auth-btn"
              onClick={() => navigate('/profile')}
              aria-label={t('auth:profileEntry')}
            >
              {user?.profilePhotoUrl && !avatarLoadFailed ? (
                <img
                  src={resolveImageUrl(user.profilePhotoUrl)}
                  alt=""
                  className="home-auth-avatar-img"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <IconProfile size={18} strokeWidth={2} />
              )}
            </button>
          ) : (
            <button
              className="home-auth-btn"
              onClick={openLoginModal}
              aria-label={t('auth:loginEntry')}
            >
              <IconProfile size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      <WeatherCard
        lat={weatherLat}
        lon={weatherLng}
      />

      <div className="home-grid">
        {marketplaceCategories.map((category) => (
          <div
            key={category.key}
            className="home-card"
            onClick={() => openCategory(category)}
          >
            <div
              className="home-card-icon"
              style={{ background: category.iconBg }}
            >
              {category.icon}
            </div>

            <h3>{t(category.labelKey)}</h3>
            <p>{t(category.descKey)}</p>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}