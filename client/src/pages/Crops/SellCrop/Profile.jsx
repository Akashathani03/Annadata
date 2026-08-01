import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProfile, updateProfile } from '../../../services/profileService';
import { useToast } from '../../../context/ToastContext';
import BottomSheet from '../../../components/common/BottomSheet';
import './Profile.css';

const EDIT_FIELDS = [
  ['name', 'farmerName'],
  ['phone', 'phone'],
  ['whatsapp', 'whatsapp'],
  ['village', 'village'],
  ['taluk', 'taluk'],
  ['district', 'district'],
];

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation(['listings', 'common']);
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  async function reload() {
    const result = await getProfile();
    setProfile(result);
  }

  useEffect(() => {
    reload();
  }, []);

  function openEdit() {
    setForm(profile);
    setEditing(true);
  }

  async function handleSave() {
    await updateProfile(form);
    setEditing(false);
    showToast(t('listings:profileScreen.saved'));
    reload();
  }

  if (!profile) return null;

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">👨‍🌾</div>
        <b>{profile.name}</b>
        <span>📞 {profile.phone}</span>
        <span>📍 {profile.location}</span>
      </div>

      <div className="profile-list">
        <div className="row"><span>{t('listings:profileScreen.fullName')}</span><b>{profile.name || '—'}</b></div>
        <div className="row"><span>{t('listings:profileScreen.phone')}</span><b>{profile.phone || '—'}</b></div>
        <div className="row"><span>{t('listings:profileScreen.whatsapp')}</span><b>{profile.whatsapp || profile.phone || '—'}</b></div>
        <div className="row"><span>{t('listings:profileScreen.village')}</span><b>{profile.village || '—'}</b></div>
        <div className="row"><span>{t('listings:profileScreen.taluk')}</span><b>{profile.taluk || '—'}</b></div>
        <div className="row"><span>{t('listings:profileScreen.district')}</span><b>{profile.district || '—'}</b></div>
      </div>

      <button className="sticky-bar-primary profile-full-btn" onClick={openEdit}>
        ✏️ {t('listings:profileScreen.editProfile')}
      </button>
      <button className="sticky-bar-secondary profile-full-btn" onClick={() => navigate('/')}>
        ↩️ {t('listings:profileScreen.logout')}
      </button>

      <BottomSheet open={editing} onClose={() => setEditing(false)}>
        <h3>✏️ {t('listings:profileScreen.editProfile')}</h3>
        {EDIT_FIELDS.map(([field, labelKey]) => (
          <div className="profile-field" key={field}>
            <label>{t(`listings:profileScreen.${labelKey}`)}</label>
            <input
              value={form[field] || ''}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              maxLength={field === 'phone' || field === 'whatsapp' ? 10 : undefined}
            />
          </div>
        ))}
        <div className="profile-sheet-actions">
          <button className="sticky-bar-secondary" onClick={() => setEditing(false)}>{t('listings:profileScreen.cancel')}</button>
          <button className="sticky-bar-primary" onClick={handleSave}>{t('listings:profileScreen.save')}</button>
        </div>
      </BottomSheet>
    </div>
  );
}
