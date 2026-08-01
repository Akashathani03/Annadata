import { useTranslation } from 'react-i18next';
import './Schemes.css';

export default function SchemeCard({ scheme, onViewDetails, onApply }) {
  const { t } = useTranslation('govSchemes');

  return (
    <div className="scheme-card">
      <div className="scheme-top">
        <div className="scheme-icon" style={{ background: scheme.iconBg }}>{scheme.icon}</div>
        <div className="scheme-title">
          <b>{scheme.title}</b>
          <span className="dept">{scheme.dept}</span>
        </div>
        <span className={`scheme-status status-${scheme.status}`}>
          {scheme.status === 'open' ? t('govSchemes:statusOpen') : t('govSchemes:statusClosing')}
        </span>
      </div>
      <p className="scheme-desc">{scheme.description}</p>
      <div className="scheme-meta">
        <span>💵 <b>{scheme.amount}</b></span>
        <span>📅 {t('govSchemes:deadlineLabel')}: <b>{scheme.deadline}</b></span>
        <span>👥 <b>{scheme.appliedCount}</b> {t('govSchemes:appliedSuffix')}</span>
      </div>
      <div className="scheme-actions">
        <button className="btn-apply" onClick={() => onApply(scheme)}>{t('govSchemes:applyNow')}</button>
        <button className="btn-details" onClick={() => onViewDetails(scheme)}>{t('govSchemes:viewDetails')}</button>
      </div>
    </div>
  );
}
