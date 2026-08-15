import { useTranslation } from 'react-i18next';
import MessageBubble from './MessageBubble';
import DiagnosisCard from './DiagnosisCard';
import AgroWeatherCard from './AgroWeatherCard';
import MarketPriceCard from './MarketPriceCard';
import FertilizerCard from './FertilizerCard';
import ListingResultCard from './ListingResultCard';

// Single dispatcher for every assistant message shape - this is the
// "prepared" rendering path requirement 3 asks for. A message with no
// cardType (or cardType: 'text') renders as a plain MessageBubble;
// anything else renders the matching card. Centralizing this here
// means ChatArea's own render loop stays simple and there is exactly
// one place that knows how to map cardType -> component (no
// duplicated switch logic anywhere else).
//
// More Details (expand/collapse) state is intentionally static here
// (expanded=false, no-op onToggle) - real per-message toggle state is
// out of scope for this step.
export default function AIMessageContent({ message, onRetry, onAction }) {
  const { t } = useTranslation(['agroAI']);
  const { cardType, cardData, text, status, action } = message;

  if (!cardType || cardType === 'text') {
    const displayText = status === 'failed' && !text ? t('agroAI:message.replyFailed') : text;
    return (
      <MessageBubble
        sender="assistant"
        text={displayText}
        status={status}
        onRetry={onRetry}
        onAction={action ? () => onAction?.(action) : undefined}
      />
    );
  }

  const CARD_COMPONENTS = {
    diagnosis: DiagnosisCard,
    weather: AgroWeatherCard,
    marketPrice: MarketPriceCard,
    fertilizer: FertilizerCard,
    marketplaceListing: ListingResultCard,
  };

  const CardComponent = CARD_COMPONENTS[cardType];
  if (!CardComponent) {
    // Unknown cardType - fail safely to plain text rather than crash.
    return <MessageBubble sender="assistant" text={text} status={status} onRetry={onRetry} />;
  }

  return <CardComponent {...cardData} expanded={false} onToggle={() => {}} />;
}
