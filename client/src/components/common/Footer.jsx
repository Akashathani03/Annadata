import { useTranslation } from 'react-i18next';
import { IconCall, IconMail, IconInstagram, IconFacebook, IconYoutube } from '../icons';
import { FOOTER_CONTACT, FOOTER_SOCIAL } from '../../config/footerConfig';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation('common');
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-brand">
        <div className="app-footer-logo">🌾</div>
        <div>
          <b>{t('common:appName')}</b>
          <span>{t('common:tagline')}</span>
        </div>
      </div>

      <div className="app-footer-contact">
        {FOOTER_CONTACT.phone && (
          <a
            href={`tel:${FOOTER_CONTACT.phone.replace(/[^+\d]/g, '')}`}
            className="app-footer-contact-link"
          >
            <IconCall size={15} strokeWidth={2} />
            {FOOTER_CONTACT.phone}
          </a>
        )}
        {FOOTER_CONTACT.email && (
          <a href={`mailto:${FOOTER_CONTACT.email}`} className="app-footer-contact-link">
            <IconMail size={15} strokeWidth={2} />
            {FOOTER_CONTACT.email}
          </a>
        )}
      </div>

      <div className="app-footer-social">
        {FOOTER_SOCIAL.instagram && (
          <a
            href={FOOTER_SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="app-footer-social-btn"
          >
            <IconInstagram size={16} />
          </a>
        )}
        {FOOTER_SOCIAL.facebook && (
          <a
            href={FOOTER_SOCIAL.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="app-footer-social-btn"
          >
            <IconFacebook size={16} />
          </a>
        )}
        {FOOTER_SOCIAL.youtube && (
          <a
            href={FOOTER_SOCIAL.youtube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="app-footer-social-btn"
          >
            <IconYoutube size={16} />
          </a>
        )}
      </div>

      <div className="app-footer-copyright">
        © {year} {t('common:appName')}. {t('common:allRightsReserved')}
      </div>
    </footer>
  );
}
