import { useTranslation } from 'react-i18next';
import { IconRefresh, IconChevronRight } from '../../../components/icons';
import './MessageBubble.css';

// Purely presentational. photoUrl is optional and additive (Step 13) -
// existing text-only call sites are unaffected. When both photoUrl and
// text are present (an image with a caption), the photo renders above
// the caption text, matching the locked Image Upload Flow design.
//
// sender:    'user' | 'assistant'
// text:      string - plain text, or an image's optional caption
// photoUrl:  string (data URL or eventual real URL) - optional
// timestamp: string, already formatted by the caller
// status:    'sending' | 'sent' | 'failed'
//   - 'sending': subtle dim on the content, no interactive controls
//     (cannot be retried, per requirement 1) - the existing spinner
//     overlay on images from Step 13 is unchanged.
//   - 'failed' (Step 14): dimmed content + a visible "Retry" button,
//     reusing the same icon already used for Retake in the Image
//     Upload Flow, for consistent iconography.
// onRetry:   called with no args when Retry is tapped - only rendered
//            when status is 'failed'. The retry pipeline itself lives
//            entirely in useAgroAIChat; this component only reports
//            the tap.
// onAction:  Step 17, Design B - called with no args when a "Go there"
//            button is tapped, only rendered when the caller passes
//            one (i.e. the message carries a navigate action). This
//            component never decides where to go - it only reports
//            the tap; resolving and performing the actual navigation
//            happens entirely outside this purely presentational file.
export default function MessageBubble({ sender, text, photoUrl, timestamp, status, onRetry, onAction }) {
  const { t } = useTranslation(['agroAI']);
  const isUser = sender === 'user';
  const isFailed = status === 'failed';

  return (
    <div className={`message-bubble-row ${isUser ? 'is-user' : 'is-assistant'}`}>
      <div
        className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}
        data-status={status}
      >
        {photoUrl && (
          <div className="message-bubble-photo-frame">
            <img src={photoUrl} alt="" className="message-bubble-photo" />
            {status === 'sending' && <span className="message-bubble-uploading-spinner" aria-hidden="true" />}
          </div>
        )}
        {text && <p className="message-bubble-text">{text}</p>}
        {timestamp && <time className="message-bubble-timestamp">{timestamp}</time>}

        {isFailed && (
          <button type="button" className="message-bubble-retry-btn" onClick={onRetry}>
            <IconRefresh size={13} strokeWidth={2} aria-hidden="true" />
            {t('agroAI:message.retry')}
          </button>
        )}

        {onAction && !isFailed && (
          <button type="button" className="message-bubble-action-btn" onClick={onAction}>
            {t('agroAI:message.goThere')}
            <IconChevronRight size={13} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
