import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/common/AppShell';
import { useAuth } from '../../context/AuthContext';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import useAgroAIChat from './hooks/useAgroAIChat';
import { resolveDestinationRoute } from '../../config/agroAINavigation';
import './AgroAI.css';

export default function AgroAI() {
  const navigate = useNavigate();
  const { t } = useTranslation(['navigation']);
  const { user, loading, openLoginModal } = useAuth();
  const { messages, sendMessage, sendImageMessage, retryMessage, isAiThinking } = useAgroAIChat();

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
    <AppShell title={t('navigation:category.agroAI')} onBack={() => navigate('/')}>
      <div className="agroai-page">
        <ChatArea
          messages={messages}
          onSend={sendMessage}
          isAiThinking={isAiThinking}
          onRetry={retryMessage}
          onAction={handleAction}
        />
        <InputArea onSend={sendMessage} onSendImage={sendImageMessage} />
      </div>
    </AppShell>
  );
}
