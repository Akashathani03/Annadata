import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { updateUserProfile } from '../../services/usersService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../components/common/AppShell';
import BottomSheet from '../../components/common/BottomSheet';
import './Profile.css';

const LANG_OPTIONS = [
  { id: 'mix', labelKey: 'common:languageMix' },
  { id: 'kn', labelKey: 'common:languageKn' },
  { id: 'en', labelKey: 'common:languageEn' },
];

const EDIT_FIELDS = [
  ['name', 'listings:profileScreen.farmerName'],
  ['whatsapp', 'listings:profileScreen.whatsapp'],
  ['village', 'listings:profileScreen.village'],
  ['taluk', 'listings:profileScreen.taluk'],
  ['district', 'listings:profileScreen.district'],
  ['state', 'common:state'],
];

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation(['listings', 'common']);
  const { user, loading, logout, refreshUser, openLoginModal } = useAuth();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate, openLoginModal]);

  if (!user) return null;

  function openEdit() {
    setForm(user);
    setEditing(true);
  }

  async function handleSave() {
    await updateUserProfile(user.id, form);
    await refreshUser();
    setEditing(false);
    showToast(t('listings:profileScreen.saved'));
  }

  async function handleLanguageChange(langId) {
    await updateUserProfile(user.id, { language: langId });
    await refreshUser();
    i18n.changeLanguage(langId);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <AppShell title={t('common:profile')} onBack={() => navigate(-1)}>
      <div className="profile-page">
        <div className="profile-hero">
          <div className="profile-avatar">👨‍🌾</div>
          <b>{user.name || 'Farmer'}</b>
          <span>📞 {user.phone}</span>
          <span>📍 {user.location || '—'}</span>
        </div>

        <div className="profile-list">
          <div className="row"><span>{t('listings:profileScreen.fullName')}</span><b>{user.name || '—'}</b></div>
          <div className="row"><span>{t('listings:profileScreen.phone')}</span><b>{user.phone || '—'}</b></div>
          <div className="row"><span>{t('listings:profileScreen.village')}</span><b>{user.village || '—'}</b></div>
          <div className="row"><span>{t('listings:profileScreen.taluk')}</span><b>{user.taluk || '—'}</b></div>
          <div className="row"><span>{t('listings:profileScreen.district')}</span><b>{user.district || '—'}</b></div>
          <div className="row"><span>{t('common:state')}</span><b>{user.state || '—'}</b></div>
        </div>

        <div className="profile-section-label">{t('common:language')}</div>
        <div className="lang-choice profile-lang-choice">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={user.language === opt.id ? 'active' : ''}
              onClick={() => handleLanguageChange(opt.id)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        <button className="sticky-bar-primary profile-full-btn" onClick={openEdit}>
          ✏️ {t('listings:profileScreen.editProfile')}
        </button>
        <button className="sticky-bar-secondary profile-full-btn" onClick={handleLogout}>
          ↩️ {t('listings:profileScreen.logout')}
        </button>

        <BottomSheet open={editing} onClose={() => setEditing(false)}>
          <h3>✏️ {t('listings:profileScreen.editProfile')}</h3>
          {EDIT_FIELDS.map(([field, labelKey]) => (
            <div className="profile-field" key={field}>
              <label>{t(labelKey)}</label>
              <input
                value={form[field] || ''}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              />
            </div>
          ))}
          <div className="profile-sheet-actions">
            <button className="sticky-bar-secondary" onClick={() => setEditing(false)}>{t('listings:profileScreen.cancel')}</button>
            <button className="sticky-bar-primary" onClick={handleSave}>{t('listings:profileScreen.save')}</button>
          </div>
        </BottomSheet>
      </div>
    </AppShell>
  );
}
