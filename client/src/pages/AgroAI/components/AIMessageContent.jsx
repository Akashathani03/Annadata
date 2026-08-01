import MessageBubble from './MessageBubble';
import DiagnosisCard from './DiagnosisCard';
import AgroWeatherCard from './AgroWeatherCard';
import MarketPriceCard from './MarketPriceCard';
import FertilizerCard from './FertilizerCard';

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
export default function AIMessageContent({ message }) {
  const { cardType, cardData, text, status } = message;

  if (!cardType || cardType === 'text') {
    return <MessageBubble sender="assistant" text={text} status={status} />;
  }

  const CARD_COMPONENTS = {
    diagnosis: DiagnosisCard,
    weather: AgroWeatherCard,
    marketPrice: MarketPriceCard,
    fertilizer: FertilizerCard,
  };

  const CardComponent = CARD_COMPONENTS[cardType];
  if (!CardComponent) {
    // Unknown cardType - fail safely to plain text rather than crash.
    return <MessageBubble sender="assistant" text={text} status={status} />;
  }

  return <CardComponent {...cardData} expanded={false} onToggle={() => {}} />;
}
