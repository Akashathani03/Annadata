import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/common/AppShell';
import { IconMenu } from '../../components/icons';
import { useAuth } from '../../context/AuthContext';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import useAgroAIChat from './hooks/useAgroAIChat';
import { resolveDestinationRoute } from '../../config/agroAINavigation';
import './AgroAI.css';

export default function AgroAI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('session');
  const { t } = useTranslation(['navigation', 'agroAI', 'common']);
  const { user, loading, openLoginModal } = useAuth();
  const { messages, sendMessage, sendImageMessage, retryMessage, isAiThinking, isLoadingHistory } =
    useAgroAIChat(sessionIdParam);

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
      navigate('/', { replace: true });
    }
  }, [loading, user, navigate, openLoginModal]);

  if (!user) return null;

  // Step 17, Design B: the backend already validated this action's
  // destination against its own stable identifier list before this
  // message was ever persisted - this is purely "map identifier to
  // route and go," never a routing decision of its own. An
  // unrecognized identifier (which shouldn't happen, given backend
  // validation, but is handled defensively) does nothing rather than
  // guessing a fallback route.
  function handleAction(action) {
    if (action?.type !== 'navigate') return;
    const route = resolveDestinationRoute(action.destination);
    if (route) navigate(route);
  }

  return (
    <AppShell
      title={t('navigation:category.agroAI')}
      onBack={() => navigate('/')}
      menuAction={{
        icon: IconMenu,
        ariaLabel: t('agroAI:previousChats.hamburgerAriaLabel'),
        onClick: () => navigate('/agro-ai/history'),
      }}
    >
      <div className="agroai-page">
        {isLoadingHistory ? (
          <p style={{ padding: 16, color: 'var(--muted)' }}>{t('common:loading')}</p>
        ) : (
          <>
            <ChatArea
              messages={messages}
              onSend={sendMessage}
              isAiThinking={isAiThinking}
              onRetry={retryMessage}
              onAction={handleAction}
            />
            <InputArea onSend={sendMessage} onSendImage={sendImageMessage} />
          </>
        )}
      </div>
    </AppShell>
  );
}
