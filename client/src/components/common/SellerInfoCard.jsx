import { useTranslation } from 'react-i18next';
import './SellerInfoCard.css';

// Info-only by design: the prototype has exactly one Call/WhatsApp
// action point (the sticky contact bar), not a second one here.
export default function SellerInfoCard({ name, location, phone }) {
  const { t } = useTranslation('buyCrops');

  return (
    <div className="seller-info-card">
      <div className="seller-info-title">{t('detail.sellerInfo')}</div>
      <div className="seller-info-row">
        <span className="seller-info-avatar">👨‍🌾</span>
        <div>
          <b>{name}</b>
          <span>📍 {location || '—'}</span>
        </div>
      </div>
      <div className="seller-info-phone-last">📞 {phone}</div>
    </div>
  );
}
