import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBack, IconProfile } from '../icons';
import { useAuth } from '../../context/AuthContext';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import './AppShell.css';

export default function AppShell({ title, subtitle, onBack, navItems, activeNavKey, stickyBar, children, hideAvatar }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.profilePhotoUrl]);

  function handleAvatarClick() {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      openLoginModal();
    }
  }

  return (
    <div className="app-shell">
      <header className="app-shell-bar">
        <button className="app-shell-round-btn" onClick={onBack} aria-label="Back">
          <IconBack size={20} strokeWidth={2} />
        </button>
        <div className="app-shell-titleblock">
          <b>{title}</b>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {!hideAvatar && (
          <button className="app-shell-avatar-btn" onClick={handleAvatarClick} aria-label="Profile">
            {user?.profilePhotoUrl && !avatarLoadFailed ? (
              <img
                src={resolveImageUrl(user.profilePhotoUrl)}
                alt=""
                className="app-shell-avatar-img"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <IconProfile size={17} strokeWidth={2} />
            )}
          </button>
        )}
      </header>

      <main className="app-shell-content">{children}</main>

      {stickyBar && <div className="app-shell-sticky-bar">{stickyBar}</div>}

      {navItems && (
        <nav className="app-shell-bottomnav">
          {navItems.map((item) => (
            <a
              key={item.key}
              className={item.key === activeNavKey ? 'active' : ''}
              onClick={() => navigate(item.route)}
            >
              <span className="ic"><item.icon size={19} strokeWidth={2} /></span>
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
