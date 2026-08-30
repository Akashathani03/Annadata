import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import {
  updateUserProfile,
  updateProfilePhoto,
} from '../../services/usersService';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppShell from '../../components/common/AppShell';
import BottomSheet from '../../components/common/BottomSheet';
import LocationCapture from '../../components/common/LocationCapture';
import { IconBack, IconCamera, IconPhoto, IconClose, IconProfile } from '../../components/icons';
import { KARNATAKA } from '../../data/karnatakaLocations';
import './Profile.css';

const LANG_OPTIONS = [
  { id: 'en', labelKey: 'common:languageEn' },
  { id: 'kn', labelKey: 'common:languageKn' },
  { id: 'mix', labelKey: 'common:languageMix' },
];

const EDIT_FIELDS = [
  ['name', 'listings:profileScreen.farmerName'],
  ['whatsapp', 'listings:profileScreen.whatsapp'],
];

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation(['listings', 'common']);
  const {
    user,
    loading,
    logout,
    refreshUser,
    openLoginModal,
  } = useAuth();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const [avatarStage, setAvatarStage] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.profilePhotoUrl]);

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate, openLoginModal]);

  if (!user) return null;

  function openEdit() {
    setForm({
      ...user,
      state: user.state || KARNATAKA,
    });
    setEditing(true);
  }

  function handleAvatarFileSelected(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarPreviewUrl(reader.result);
      setAvatarFile(file);
      setAvatarStage('preview');
    };

    reader.readAsDataURL(file);
  }

  function closeAvatarSheet() {
    setAvatarStage(null);
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
  }

  async function handleAvatarSave() {
    if (!avatarFile) return;

    try {
      await updateProfilePhoto(user.id, avatarFile);
      await refreshUser();
      closeAvatarSheet();
      showToast(t('listings:profileScreen.saved'));
    } catch {
      showToast(t('listings:profileScreen.photoUploadFailed'));
    }
  }

  async function handleSave() {
    try {
      await updateUserProfile(user.id, form);
      await refreshUser();
      setEditing(false);
      showToast(t('listings:profileScreen.saved'));
    } catch {
      showToast(t('listings:profileScreen.saveFailed'));
    }
  }

  async function handleLanguageChange(langId) {
    try {
      await updateUserProfile(user.id, { language: langId });
      await refreshUser();
      i18n.changeLanguage(langId);
    } catch {
      showToast(t('listings:profileScreen.saveFailed'));
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <AppShell
      title={t('common:profile')}
      onBack={() => navigate(-1)}
      hideAvatar
    >
      <div className="profile-page">
        <div className="profile-hero">
          <button
            type="button"
            className="profile-avatar profile-avatar-btn"
            onClick={() => setAvatarStage('chooser')}
            aria-label={t('listings:profileScreen.changePhoto')}
          >
            {user.profilePhotoUrl && !avatarLoadFailed ? (
              <img
                src={resolveImageUrl(user.profilePhotoUrl)}
                alt=""
                className="profile-avatar-img"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <IconProfile size={34} strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>

          <b>{user.name || 'Farmer'}</b>
          <span>📞 {user.phone}</span>
          <span>📍 {user.location || '—'}</span>
        </div>

        <div className="profile-list">
          <div className="row">
            <span>{t('listings:profileScreen.fullName')}</span>
            <b>{user.name || '—'}</b>
          </div>

          <div className="row">
            <span>{t('listings:profileScreen.phone')}</span>
            <b>{user.phone || '—'}</b>
          </div>

          <div className="row">
            <span>{t('listings:profileScreen.village')}</span>
            <b>{user.village || '—'}</b>
          </div>

          <div className="row">
            <span>{t('listings:profileScreen.taluk')}</span>
            <b>{user.taluk || '—'}</b>
          </div>

          <div className="row">
            <span>{t('listings:profileScreen.district')}</span>
            <b>{user.district || '—'}</b>
          </div>

          <div className="row">
            <span>{t('common:state')}</span>
            <b>{user.state || '—'}</b>
          </div>
        </div>

        <div className="profile-section-label">
          {t('common:language')}
        </div>

        <div className="lang-choice profile-lang-choice">
          {LANG_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.id}
              className={user.language === opt.id ? 'active' : ''}
              onClick={() => handleLanguageChange(opt.id)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="sticky-bar-primary profile-full-btn"
          onClick={openEdit}
        >
          {t('listings:profileScreen.editProfile')}
        </button>

        <button
          type="button"
          className="sticky-bar-secondary profile-full-btn"
          onClick={handleLogout}
        >
          {t('listings:profileScreen.logout')}
        </button>

        {/* Edit Profile */}
        <BottomSheet
          open={editing}
          onClose={() => setEditing(false)}
        >
          <div className="profile-edit-header">
            <button
              type="button"
              className="profile-edit-back"
              onClick={() => setEditing(false)}
              aria-label={t('common:back')}
            >
              <IconBack size={22} strokeWidth={3} aria-hidden="true" />
            </button>

            <h3>{t('listings:profileScreen.editProfile')}</h3>
          </div>

          {EDIT_FIELDS.map(([field, labelKey]) => (
            <div className="profile-field" key={field}>
              <label>{t(labelKey)}</label>

              <input
                value={form[field] || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [field]: e.target.value,
                  })
                }
              />
            </div>
          ))}

          <LocationCapture value={form} onChange={setForm} />

          <div className="profile-sheet-actions">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={() => setEditing(false)}
            >
              {t('listings:profileScreen.cancel')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleSave}
            >
              {t('listings:profileScreen.save')}
            </button>
          </div>
        </BottomSheet>

        {/* Avatar chooser */}
        <BottomSheet
          open={avatarStage === 'chooser'}
          onClose={closeAvatarSheet}
        >
          <div className="profile-sheet-header">
            <h3>{t('listings:profileScreen.changePhoto')}</h3>

            <button
              type="button"
              className="profile-sheet-close"
              onClick={closeAvatarSheet}
              aria-label={t('listings:profileScreen.cancel')}
            >
              <IconClose size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <input
            id="avatar-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) =>
              handleAvatarFileSelected(e.target.files?.[0])
            }
          />

          <input
            id="avatar-gallery-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) =>
              handleAvatarFileSelected(e.target.files?.[0])
            }
          />

          <div className="profile-avatar-choice">
            <button
              type="button"
              className="profile-avatar-choice-card"
              onClick={() =>
                document
                  .getElementById('avatar-camera-input')
                  ?.click()
              }
            >
              <span className="profile-avatar-choice-icon">
                <IconCamera size={26} strokeWidth={2} aria-hidden="true" />
              </span>
              {t('listings:profileScreen.takePhoto')}
            </button>

            <button
              type="button"
              className="profile-avatar-choice-card"
              onClick={() =>
                document
                  .getElementById('avatar-gallery-input')
                  ?.click()
              }
            >
              <span className="profile-avatar-choice-icon">
                <IconPhoto size={26} strokeWidth={2} aria-hidden="true" />
              </span>
              {t('listings:profileScreen.chooseFromGallery')}
            </button>
          </div>
        </BottomSheet>

        {/* Avatar preview */}
        <BottomSheet
          open={avatarStage === 'preview'}
          onClose={closeAvatarSheet}
        >
          <h3>{t('listings:profileScreen.changePhoto')}</h3>

          {avatarPreviewUrl && (
            <img
              src={avatarPreviewUrl}
              alt=""
              className="profile-avatar-preview-img"
            />
          )}

          <div className="profile-sheet-actions">
            <button
              type="button"
              className="sticky-bar-secondary"
              onClick={closeAvatarSheet}
            >
              {t('listings:profileScreen.cancel')}
            </button>

            <button
              type="button"
              className="sticky-bar-primary"
              onClick={handleAvatarSave}
            >
              {t('listings:profileScreen.save')}
            </button>
          </div>
        </BottomSheet>
      </div>
    </AppShell>
  );
}