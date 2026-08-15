import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import EmptyState from './EmptyState';
import MessageBubble from './MessageBubble';
import AIMessageContent from './AIMessageContent';
import TypingIndicator from './TypingIndicator';
import { agroAIQuickActions } from '../../../config/agroAIConfig';
import { IconBug, IconDroplet, IconCloud, IconRupee } from '../../../components/icons';
import './ChatArea.css';

// Maps agroAIConfig.js's icon-name strings to the actual icon
// components. This is the one small piece needed to actually consume
// the config file that already existed since Step 1 but was never
// wired in - ChatArea previously duplicated the same 4 quick actions
// in its own local array instead of using it.
const ICON_MAP = {
  bug: IconBug,
  droplet: IconDroplet,
  cloud: IconCloud,
  'currency-rupee': IconRupee,
};

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'agroAI:emptyState.greetingMorning';
  if (hour < 17) return 'agroAI:emptyState.greetingAfternoon';
  return 'agroAI:emptyState.greetingEvening';
}

const SCROLL_BOTTOM_THRESHOLD = 80; // px - "close enough to bottom" for auto-scroll purposes

export default function ChatArea({ messages = [], onSend, isAiThinking = false, onRetry, onAction }) {
  const { t } = useTranslation(['agroAI']);
  const { user } = useAuth();
  const hasMessages = messages.length > 0;
  const scrollRef = useRef(null);
  const isNearBottomRef = useRef(true);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD;
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isNearBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isAiThinking]);

  function handleQuickAction(action) {
    onSend?.(action.label);
  }

  function handleExampleClick(prompt) {
    onSend?.(prompt);
  }

  const quickActions = agroAIQuickActions.map((a) => ({
    id: a.id,
    icon: ICON_MAP[a.icon],
    label: t(a.labelKey),
  }));

  const examplePrompts = [
    t('agroAI:examplePrompts.diseaseExample'),
    t('agroAI:examplePrompts.priceExample'),
    t('agroAI:examplePrompts.weatherExample'),
  ];

  return (
    <div className="agroai-chat-area" ref={scrollRef} onScroll={handleScroll}>
      {hasMessages ? (
        <>
          {messages.map((message) =>
            message.sender === 'user' ? (
              <MessageBubble
                key={message.id}
                sender="user"
                text={message.text}
                photoUrl={message.photoUrl}
                status={message.status}
                onRetry={() => onRetry?.(message.id)}
              />
            ) : (
              <div className="message-bubble-row is-assistant" key={message.id}>
                <AIMessageContent message={message} onRetry={() => onRetry?.(message.id)} onAction={onAction} />
              </div>
            )
          )}
          {isAiThinking && <TypingIndicator />}
        </>
      ) : (
        <EmptyState
          userName={user?.name}
          greeting={t(greetingKey())}
          introduction={t('agroAI:emptyState.introduction')}
          quickActions={quickActions}
          examplePrompts={examplePrompts}
          examplesLabel={t('agroAI:emptyState.tryAsking')}
          uploadHint={t('agroAI:emptyState.uploadHint')}
          onQuickAction={handleQuickAction}
          onExampleClick={handleExampleClick}
        />
      )}
    </div>
  );
}
