import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryByKey } from '../../config/marketplaceCategories';
import { useAuth } from '../../context/AuthContext';
import './CategoryMenu.css';

// Renders the same layout for every category (Crops / Animals / Shops).
// Only the icon, title, and item list differ - all resolved from the
// marketplaceCategories config, keyed by the :categoryKey route param.
export default function CategoryMenu() {
  const { categoryKey } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['navigation', 'common']);
  const { isAuthenticated, openLoginModal } = useAuth();

  const category = getCategoryByKey(categoryKey);

  if (!category || !category.hasMenu) {
    // Unknown or menu-less category key - send the user home rather
    // than render an empty screen.
    navigate('/', { replace: true });
    return null;
  }

  function handleItemTap(item) {
    if (item.requiresAuth && !isAuthenticated) {
      openLoginModal();
      return;
    }
    navigate(item.route);
  }

  return (
    <div className="cat-menu">
      <header className="cat-menu-header">
        <button
          className="cat-menu-back"
          onClick={() => navigate('/')}
          aria-label={t('common:back')}
        >
          ←
        </button>
        <span className="cat-menu-icon">{category.icon}</span>
        <h1 className="cat-menu-title">{t(category.labelKey)}</h1>
      </header>

      <div className="cat-menu-list">
        {category.items.map((item) => (
          <button
            key={item.key}
            className="cat-menu-row"
            onClick={() => handleItemTap(item)}
          >
            <span className="cat-menu-row-icon">{item.icon}</span>
            <span className="cat-menu-row-label">{t(item.labelKey)}</span>
            <span className="cat-menu-row-chevron" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
