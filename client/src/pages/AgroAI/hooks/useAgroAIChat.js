import { useCallback, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  sendUserMessage,
  sendMockDiagnosisResponse,
  sendMockTextResponse,
} from '../../../services/agroAIService';

// Step 6: real network calls now exist, so the old fake-timer +
// "fails if text contains the word 'fail'" mock delivery logic
// (Step 14) is gone - keeping it would mean a message could genuinely
// succeed over the real network and then be artificially marked
// failed anyway, which no longer serves the purpose it was built for.
// Real failures (network errors, validation errors, a down backend)
// now drive the exact same Pending/Failed UI Step 14 already built
// and proved - only the trigger changed, not the states or their
// visual treatment.
//
// The hook's exported shape below is unchanged: { messages,
// sendMessage, sendImageMessage, retryMessage, isAiThinking }. No
// component (AgroAI.jsx, ChatArea.jsx, InputArea.jsx) needs to change.
export default function useAgroAIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const runAiThinkingThenMockDiagnosis = useCallback(() => {
    setIsAiThinking(true);
    setTimeout(async () => {
      const aiMessage = await sendMockDiagnosisResponse();
      setMessages((prev) => [...prev, aiMessage]);
      setIsAiThinking(false);
    }, 1200);
  }, []);

  const runAiThinkingThenMockTextReply = useCallback(() => {
    setIsAiThinking(true);
    setTimeout(async () => {
      const aiMessage = await sendMockTextResponse();
      setMessages((prev) => [...prev, aiMessage]);
      setIsAiThinking(false);
    }, 1200);
  }, []);

  // Shared by sendMessage, sendImageMessage, AND retryMessage - this
  // is the "existing send pipeline" every one of them reuses, not a
  // parallel implementation. Shows an optimistic local placeholder
  // immediately (preserves the exact optimistic-UI behavior already
  // approved), then replaces it with the real backend message on
  // success, or marks it failed on a real error.
  const attemptSend = useCallback(
    async ({ tempId, text, photoUrl, onSuccess }) => {
      try {
        const message = await sendUserMessage({ text, photoUrl });
        setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
        onSuccess?.();
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

      attemptSend({ tempId, text: trimmed, onSuccess: runAiThinkingThenMockTextReply });
    },
    [user, attemptSend, runAiThinkingThenMockTextReply]
  );

  const sendImageMessage = useCallback(
    ({ photoUrl, caption }) => {
      if (!user || !photoUrl) return;

      const tempId = `temp_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: tempId, sender: 'user', type: 'image', text: caption, photoUrl, status: 'sending' },
      ]);

      attemptSend({ tempId, text: caption, photoUrl, onSuccess: runAiThinkingThenMockDiagnosis });
    },
    [user, attemptSend, runAiThinkingThenMockDiagnosis]
  );

  // Retry means "attempt the send again" (see the note above) - the
  // failed message almost certainly never reached the backend in the
  // first place, so there's nothing server-side to flip back to
  // sending. Re-runs the exact same attemptSend pipeline, not a
  // separate implementation.
  const retryMessage = useCallback(
    (messageId) => {
      const target = messages.find((m) => m.id === messageId);
      if (!target || target.status !== 'failed') return;

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'sending' } : m))
      );

      attemptSend({
        tempId: messageId,
        text: target.text,
        photoUrl: target.photoUrl,
        onSuccess: target.photoUrl ? runAiThinkingThenMockDiagnosis : runAiThinkingThenMockTextReply,
      });
    },
    [messages, attemptSend, runAiThinkingThenMockDiagnosis, runAiThinkingThenMockTextReply]
  );

  return { messages, sendMessage, sendImageMessage, retryMessage, isAiThinking };
}
