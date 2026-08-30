import { IconCall } from '../icons';
import './ContactButtons.css';

// phone: raw digits (no country code). message: plain text, will be
// URL-encoded here - callers should not pre-encode it.
export default function ContactButtons({
  phone,
  message,
  callLabel,
  whatsappLabel,
  size = 'default',
}) {
  const encodedMessage = message ? encodeURIComponent(message) : '';

  return (
    <div className={`contact-buttons contact-buttons-${size}`}>
      <a className="btn-call" href={`tel:${phone}`}>
        <IconCall size={16} strokeWidth={2} aria-hidden="true" />
        {callLabel}
      </a>

      <a
        className="btn-whatsapp"
        href={`https://wa.me/91${phone}${encodedMessage ? `?text=${encodedMessage}` : ''}`}
        target="_blank"
        rel="noreferrer"
      >
        {whatsappLabel}
      </a>
    </div>
  );
}