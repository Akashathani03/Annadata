import { useCallback, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useUserLocation } from '../../../context/LocationContext';
import { sendUserMessage, getAssistantReply } from '../../../services/agroAIService';

// Step 15: real reply pipeline now exists, so the old
// runAiThinkingThenMockDiagnosis/runAiThinkingThenMockTextReply split
// (which guessed the reply type from whether a photo was attached,
// entirely on the frontend) is gone. The backend's Intent Router
// genuinely decides what kind of response fits a message - this hook
// no longer makes that decision at all, it just asks for a reply and
// renders whatever comes back. This is what "frontend remains a thin
// client" means concretely here.
//
// The hook's exported shape below is unchanged: { messages,
// sendMessage, sendImageMessage, retryMessage, isAiThinking }. No
// component (AgroAI.jsx, ChatArea.jsx, InputArea.jsx) needs to change.
export default function useAgroAIChat() {
  const { user } = useAuth();
  const { lat, lng } = useUserLocation();
  const [messages, setMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const runAiThinkingThenRealReply = useCallback(
    async (userMessageId) => {
      setIsAiThinking(true);
      try {
        const aiMessage = await getAssistantReply(userMessageId, { lat, lng });
        setMessages((prev) => [...prev, aiMessage]);
      } catch {
        // A real reply failure - now visible and retryable, matching
        // the same failed-message pattern already built for user
        // messages. replyToMessageId is local-only state (never sent
        // to the backend) so retryMessage below knows which original
        // user message to re-attempt a reply for.
        setMessages((prev) => [
          ...prev,
          {
            id: `temp_reply_${Date.now()}`,
            sender: 'assistant',
            type: 'text',
            status: 'failed',
            replyToMessageId: userMessageId,
          },
        ]);
      } finally {
        setIsAiThinking(false);
      }
    },
    [lat, lng]
  );

  // Shared by sendMessage, sendImageMessage, AND retryMessage - this
  // is the "existing send pipeline" every one of them reuses, not a
  // parallel implementation. Shows an optimistic local placeholder
  // immediately (preserves the exact optimistic-UI behavior already
  // approved), then replaces it with the real backend message on
  // success, or marks it failed on a real error. onSuccess now
  // receives the real saved message (needed to know its id for the
  // reply call), not called with no arguments as before.
  const attemptSend = useCallback(
    async ({ tempId, text, photoUrl, onSuccess }) => {
      try {
        const message = await sendUserMessage({ text, photoUrl });
        setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
        onSuccess?.(message);
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
        );
      }
    },
    []
  );

  const sendMessage = useCallback(
    (text) => {
      const trimmed = text?.trim();
      if (!user || !trimmed) return;

      const tempId = `temp_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: tempId, sender: 'user', type: 'text', text: trimmed, status: 'sending' },
      ]);

      attemptSend({
        tempId,
        text: trimmed,
        onSuccess: (message) => runAiThinkingThenRealReply(message.id),
      });
    },
    [user, attemptSend, runAiThinkingThenRealReply]
  );

  const sendImageMessage = useCallback(
    ({ photoUrl, caption }) => {
      if (!user || !photoUrl) return;

      const tempId = `temp_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: tempId, sender: 'user', type: 'image', text: caption, photoUrl, status: 'sending' },
      ]);

      attemptSend({
        tempId,
        text: caption,
        photoUrl,
        onSuccess: (message) => runAiThinkingThenRealReply(message.id),
      });
    },
    [user, attemptSend, runAiThinkingThenRealReply]
  );

  // Retry means "attempt the send again" - the failed message almost
  // certainly never reached the backend in the first place, so there's
  // nothing server-side to flip back to sending. Re-runs the exact
  // same attemptSend pipeline, not a separate implementation.
  const retryMessage = useCallback(
    (messageId) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target || target.status !== 'failed') return;

      if (target.sender === 'assistant') {
        // A failed reply, not a failed send - remove the placeholder
        // and re-attempt against the same original user message. There
        // is nothing to re-send; the user's message already succeeded.
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        runAiThinkingThenRealReply(target.replyToMessageId);
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'sending' } : m))
      );

      attemptSend({
        tempId: messageId,
        text: target.text,
        photoUrl: target.photoUrl,
        onSuccess: (message) => runAiThinkingThenRealReply(message.id),
      });
    },
    [messages, attemptSend, runAiThinkingThenRealReply]
  );

  return { messages, sendMessage, sendImageMessage, retryMessage, isAiThinking };
}
