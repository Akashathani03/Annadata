import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PlaceholderPage.css';

// Generic "this destination exists, its real module isn't built yet"
// screen. Used for every leaf route in Phase 1. Swapping a placeholder
// for its real module later means deleting one <Route> line in App.jsx -
// nothing here needs to change.
export default function PlaceholderPage({ icon, titleKey }) {
  const navigate = useNavigate();
  const { t } = useTranslation(['navigation', 'common']);

  return (
    <div className="placeholder-page">
      <button
        className="placeholder-back"
        onClick={() => navigate(-1)}
        aria-label={t('common:back')}
      >
        ← {t('common:back')}
      </button>
      <div className="placeholder-icon">{icon}</div>
      <h1 className="placeholder-title">{t(titleKey)}</h1>
      <p className="placeholder-note">{t('common:comingSoon')}</p>
    </div>
  );
}
