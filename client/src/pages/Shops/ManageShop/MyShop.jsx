import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyShop, saveShop } from '../../../services/shopsService';
import { KARNATAKA } from '../../../data/karnatakaLocations';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import PhotoUpload from '../../../components/common/PhotoUpload';
import GpsLocationSection from '../../../components/common/GpsLocationSection';
import './ManageShop.css';

export default function MyShop() {
  const { t } = useTranslation(['shops']);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    shopName: '', ownerName: '', phone: '', whatsapp: '', address: '', photoUrl: '',
  });
  const [locationParts, setLocationParts] = useState({
    village: '', area: '', taluk: '', district: '', state: KARNATAKA,
  });
  const [coords, setCoords] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    getMyShop(user.id).then((shop) => {
      if (shop) {
        setForm((f) => ({ ...f, ...shop }));

        setLocationParts({
          village: shop.locationVillage || '',
          area: shop.locationArea || '',
          taluk: shop.locationTaluk || '',
          district: shop.locationDistrict || '',
          state: shop.locationState || KARNATAKA,
        });

        if (shop.lat != null && shop.lng != null) {
          setCoords({ lat: shop.lat, lng: shop.lng, accuracy: null });
        }
      }
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.phone.trim()) {
      showToast(t('shops:manage.phoneRequired'));
      return;
    }

    const location = [locationParts.village, locationParts.area, locationParts.taluk, locationParts.district]
      .filter(Boolean)
      .join(', ');

    try {
      await saveShop(user.id, {
        ...form,
        location,
        locationVillage: locationParts.village,
        locationArea: locationParts.area,
        locationTaluk: locationParts.taluk,
        locationDistrict: locationParts.district,
        locationState: locationParts.state,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      showToast(t('shops:manage.shopSaved'));
    } catch {
      showToast(t('shops:manage.saveFailed'));
    }
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
      <GpsLocationSection
        locationParts={locationParts}
        onLocationPartsChange={setLocationParts}
        coords={coords}
        onCoordsChange={setCoords}
      />

      <div style={{ height: 70 }} />
      <div className="som-sticky-bar som-sticky-bar-shopdetails">
        <button className="som-save-btn som-save-btn-shopdetails" onClick={handleSave}>{t('shops:manage.saveShopDetails')}</button>
      </div>
    </div>
  );
}
