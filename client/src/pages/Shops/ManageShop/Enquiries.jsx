import { useTranslation } from 'react-i18next';
import './ManageShop.css';

// No shop-enquiry creation mechanism exists yet (Near Shop's contact
// buttons go straight to tel:/wa.me, they don't log an enquiry record),
// so this always shows the genuine empty state rather than fake data.
export default function Enquiries() {
  const { t } = useTranslation(['shops']);

  return (
    <div className="som-page">
      <div className="som-sec-title">{t('shops:manage.enquiries')}</div>
      <div className="som-empty-state">
        <span className="ei">💬</span>
        <b>{t('shops:manage.noEnquiriesTitle')}</b>
        <span>{t('shops:manage.noEnquiriesBody')}</span>
      </div>
    </div>
  );
}
