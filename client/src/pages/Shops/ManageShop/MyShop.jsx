import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyShop, saveShop } from '../../../services/shopsService';
import { reverseGeocode } from '../../../services/geocodingService';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import PhotoUpload from '../../../components/common/PhotoUpload';
import { IconCurrentLocation } from '../../../components/icons';
import './ManageShop.css';

export default function MyShop() {
  const { t } = useTranslation(['shops']);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    shopName: '', ownerName: '', phone: '', whatsapp: '', location: '', address: '', photoUrl: '',
  });
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    getMyShop(user.id).then((shop) => {
      if (shop) setForm({ ...form, ...shop });
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleUseGps() {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsStatus('geocoding');

        const address = await reverseGeocode(lat, lng);
        const composedLocation = address
          ? [address.village, address.taluk, address.district].filter(Boolean).join(', ')
          : '';

        setForm((f) => ({
          ...f,
          lat,
          lng,
          location: composedLocation || f.location,
        }));
        setGpsStatus(composedLocation ? 'captured' : 'error');
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }

  async function handleSave() {
    await saveShop(user.id, form);
    showToast(t('shops:manage.shopSaved'));
  }

  if (!loaded) return null;

  return (
    <div className="som-page">
      <div className="som-sec-title">{t('shops:manage.shopDetails')}</div>

      <PhotoUpload
        value={form.photoUrl}
        onChange={(v) => setField('photoUrl', v)}
        label={t('shops:manage.addShopPhoto')}
        hint="JPG, PNG up to 5MB"
      />

      <label className="som-label">{t('shops:manage.shopName')} *</label>
      <input className="som-input" value={form.shopName} onChange={(e) => setField('shopName', e.target.value)} placeholder="e.g. Ramesh Agro Store" />

      <label className="som-label">{t('shops:manage.ownerName')} *</label>
      <input className="som-input" value={form.ownerName} onChange={(e) => setField('ownerName', e.target.value)} placeholder="e.g. Ramesh Kumar" />

      <label className="som-label">{t('shops:manage.mobileNumber')} *</label>
      <input className="som-input" type="tel" maxLength={10} value={form.phone} onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))} placeholder="98765 43210" />

      <label className="som-label">{t('shops:manage.whatsappNumber')} *</label>
      <input className="som-input" type="tel" maxLength={10} value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value.replace(/\D/g, ''))} placeholder="98765 43210" />

      <label className="som-label">{t('shops:manage.shopLocation')} *</label>
      <input className="som-input" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder={t('shops:manage.shopLocationPlaceholder')} />
      <button type="button" className="som-gps-btn" onClick={handleUseGps}>
        <IconCurrentLocation size={16} strokeWidth={2} /> Use Current Location
      </button>
      <div className="som-sub" style={{ margin: '6px 0 0' }}>
        {gpsStatus === 'capturing' && 'Getting location…'}
        {gpsStatus === 'geocoding' && 'Fetching address…'}
        {gpsStatus === 'captured' && '✓ Location captured'}
        {gpsStatus === 'error' && '⚠️ Could not get location. Please enter manually.'}
      </div>

      <label className="som-label">{t('shops:manage.addressOptional')}</label>
      <textarea className="som-input" rows={2} value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder={t('shops:manage.addressPlaceholder')} />

      <div style={{ height: 70 }} />
      <div className="som-sticky-bar">
        <button className="som-save-btn" onClick={handleSave}>{t('shops:manage.saveShopDetails')}</button>
      </div>
    </div>
  );
}
