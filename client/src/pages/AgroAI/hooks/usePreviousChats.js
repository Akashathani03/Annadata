import { useCallback, useEffect, useState } from 'react';
import * as agroAIHistoryService from '../../../services/agroAIHistoryService';

// The only thing that calls agroAIHistoryService directly - PreviousChats.jsx
// only ever calls this hook, same "component never touches the service
// layer directly" rule useAgroAIChat already follows for messages.
export default function usePreviousChats() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const sessions = await agroAIHistoryService.listConversations();
      setConversations(sessions);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renameConversation = useCallback(async (id, title) => {
    const updated = await agroAIHistoryService.renameConversation(id, title);
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteConversation = useCallback(async (id) => {
    await agroAIHistoryService.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Same non-optimistic shape as renameConversation above - state only
  // changes after the API call succeeds, so a failure leaves the list
  // exactly as it was (never a pin that silently didn't really save).
  const setPinned = useCallback(async (id, pinned) => {
    const updated = await agroAIHistoryService.setConversationPinned(id, pinned);
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  return { conversations, loading, loadError, reload: load, renameConversation, deleteConversation, setPinned };
}
