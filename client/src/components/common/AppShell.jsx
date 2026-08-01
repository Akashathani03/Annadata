import { useNavigate } from 'react-router-dom';
import { IconBack } from '../icons';
import './AppShell.css';

export default function AppShell({ title, subtitle, onBack, navItems, activeNavKey, stickyBar, children }) {
  const navigate = useNavigate();

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
