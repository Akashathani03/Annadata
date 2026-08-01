import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/common/AppShell';
import { useAuth } from '../../context/AuthContext';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import useAgroAIChat from './hooks/useAgroAIChat';
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

  return (
    <AppShell title={t('navigation:category.agroAI')} onBack={() => navigate('/')}>
      <div className="agroai-page">
        <ChatArea messages={messages} onSend={sendMessage} isAiThinking={isAiThinking} onRetry={retryMessage} />
        <InputArea onSend={sendMessage} onSendImage={sendImageMessage} />
      </div>
    </AppShell>
  );
}
