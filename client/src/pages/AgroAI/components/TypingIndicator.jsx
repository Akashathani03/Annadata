import { useTranslation } from 'react-i18next';
import './TypingIndicator.css';

export default function TypingIndicator() {
  const { t } = useTranslation(['agroAI']);
  return (
    <div className="message-bubble-row is-assistant">
      <div className="typing-indicator" aria-live="polite" aria-label={t('agroAI:typingIndicator.ariaLabel')}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
