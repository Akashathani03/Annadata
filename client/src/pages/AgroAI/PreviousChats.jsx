import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppShell from '../../components/common/AppShell';
import BottomSheet from '../../components/common/BottomSheet';
import { IconAdd, IconMoreVertical, IconPin, IconListings, IconEdit, IconDelete } from '../../components/icons';
import { resetSession } from '../../services/agroAIService';
import { useToast } from '../../context/ToastContext';
import usePreviousChats from './hooks/usePreviousChats';
import './PreviousChats.css';

export default function PreviousChats() {
  const navigate = useNavigate();
  const { t } = useTranslation(['agroAI', 'common', 'navigation']);
  const { showToast } = useToast();
  const { conversations, loading, loadError, reload, renameConversation, deleteConversation, setPinned } =
    usePreviousChats();

  const [menuFor, setMenuFor] = useState(null); // conversation object, or null
  const [renaming, setRenaming] = useState(null); // conversation object, or null
  const [renameValue, setRenameValue] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // conversation object, or null
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  // Derived, not fetched separately (one GET already returns every
  // session) - findSessionsByUser already sorts lastActivityAt DESC,
  // so this filter preserves that order without re-sorting. A pinned
  // session intentionally also appears in allChats (unfiltered) - per
  // the approved two-section MVP, not a bug.
  const pinnedChats = conversations.filter((c) => c.pinned);
  const allChats = conversations;

  function openConversation(id) {
    navigate(`/agro-ai?session=${id}`);
  }

  function startNewChat() {
    resetSession();
    navigate('/agro-ai');
  }

  function openMenu(conversation) {
    setActionError('');
    setMenuFor(conversation);
  }

  function startRename() {
    setRenaming(menuFor);
    setRenameValue(menuFor.title || '');
    setMenuFor(null);
  }

  async function saveRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || !renaming) return;

    setRenameSaving(true);
    setActionError('');
    try {
      await renameConversation(renaming.id, trimmed);
      setRenaming(null);
    } catch {
      setActionError(t('agroAI:previousChats.renameFailed'));
    } finally {
      setRenameSaving(false);
    }
  }

  async function togglePinned() {
    if (!menuFor) return;

    const target = menuFor;
    setMenuFor(null);
    setPinBusy(true);
    try {
      await setPinned(target.id, !target.pinned);
    } catch {
      // The menu is already closed by this point (unlike Rename/Delete,
      // Pin/Unpin is a single tap with no separate confirm step to
      // keep open) - a toast is the only place left to surface this,
      // same existing app-wide pattern every other async-failure here
      // uses (CreateListing, etc.), not a new error UI invented for
      // this screen.
      showToast(t('agroAI:previousChats.pinFailed'));
    } finally {
      setPinBusy(false);
    }
  }

  function startDelete() {
    setDeleting(menuFor);
    setMenuFor(null);
  }

  async function confirmDelete() {
    if (!deleting) return;

    setDeleteBusy(true);
    setActionError('');
    try {
      await deleteConversation(deleting.id);
      setDeleting(null);
    } catch {
      setActionError(t('agroAI:previousChats.deleteFailed'));
    } finally {
      setDeleteBusy(false);
    }
  }

  // Shared by all three sections - identical row markup/behavior
  // everywhere, only the item list differs. Not a separate component
  // file (no ChatHistoryRow.jsx exists, and one row shape used in 3
  // places within the same screen doesn't need one).
  function renderRow(c) {
    return (
      <li key={c.id} className="previous-chats-row">
        {/* No per-row pin icon here on purpose - the section header
            (Pinned Chats, below) already communicates that every row
            in it is pinned; repeating the icon on each row plus again
            wherever that same chat shows up in All Chats was the
            visual noise this was reported for. The pin icon now lives
            in exactly one place: the section header itself. */}
        <button
          type="button"
          className="previous-chats-row-title"
          onClick={() => openConversation(c.id)}
        >
          <span className="previous-chats-row-title-text">{c.title || t('agroAI:previousChats.untitled')}</span>
        </button>
        <button
          type="button"
          className="previous-chats-row-menu"
          aria-label={t('agroAI:previousChats.menuAriaLabel')}
          onClick={() => openMenu(c)}
        >
          <IconMoreVertical size={18} strokeWidth={2} />
        </button>
      </li>
    );
  }

  function renderSection(icon, labelKey, items) {
    if (items.length === 0) return null;
    const Icon = icon;
    return (
      <div className="previous-chats-section">
        <div className="previous-chats-section-header">
          <Icon size={15} strokeWidth={2.5} />
          <span>{t(labelKey)}</span>
        </div>
        <ul className="previous-chats-list">{items.map(renderRow)}</ul>
      </div>
    );
  }

  return (
    <AppShell title={t('agroAI:previousChats.title')} onBack={() => navigate('/agro-ai')}>
      <div className="previous-chats-page">
        {loading && (
          <p className="previous-chats-status">{t('common:loading')}</p>
        )}

        {!loading && loadError && (
          <div className="previous-chats-status">
            <p>{t('agroAI:previousChats.loadError')}</p>
            <button type="button" className="previous-chats-retry-btn" onClick={reload}>
              {t('agroAI:previousChats.retry')}
            </button>
          </div>
        )}

        {!loading && !loadError && conversations.length === 0 && (
          <div className="previous-chats-empty">
            <p className="previous-chats-empty-title">{t('agroAI:previousChats.emptyTitle')}</p>
            <p className="previous-chats-empty-body">{t('agroAI:previousChats.emptyBody')}</p>
          </div>
        )}

        {!loading && !loadError && conversations.length > 0 && (
          <>
            {renderSection(IconPin, 'agroAI:previousChats.pinnedChats', pinnedChats)}
            {renderSection(IconListings, 'agroAI:previousChats.allChats', allChats)}
          </>
        )}
      </div>

      <button type="button" className="previous-chats-new-btn" onClick={startNewChat}>
        <IconAdd size={18} strokeWidth={2.5} />
        {t('agroAI:previousChats.newChat')}
      </button>

      {/* Three-dot action sheet */}
      <BottomSheet open={Boolean(menuFor)} onClose={() => setMenuFor(null)}>
        <button type="button" className="previous-chats-sheet-option" onClick={startRename}>
          <IconEdit size={18} strokeWidth={2} />
          {t('agroAI:previousChats.rename')}
        </button>
        <button type="button" className="previous-chats-sheet-option" disabled={pinBusy} onClick={togglePinned}>
          <IconPin size={18} strokeWidth={2} />
          {menuFor?.pinned ? t('agroAI:previousChats.unpin') : t('agroAI:previousChats.pin')}
        </button>
        <button type="button" className="previous-chats-sheet-option previous-chats-sheet-danger" onClick={startDelete}>
          <IconDelete size={18} strokeWidth={2} />
          {t('agroAI:previousChats.delete')}
        </button>
      </BottomSheet>

      {/* Rename sheet */}
      <BottomSheet open={Boolean(renaming)} onClose={() => setRenaming(null)}>
        <h3 className="previous-chats-sheet-title">{t('agroAI:previousChats.renameTitle')}</h3>
        <input
          type="text"
          className="previous-chats-rename-input"
          value={renameValue}
          maxLength={40}
          placeholder={t('agroAI:previousChats.renamePlaceholder')}
          onChange={(e) => setRenameValue(e.target.value)}
          autoFocus
        />
        {actionError && <p className="previous-chats-error">{actionError}</p>}
        <div className="previous-chats-sheet-actions">
          <button type="button" className="sticky-bar-secondary" onClick={() => setRenaming(null)}>
            {t('common:cancel')}
          </button>
          <button
            type="button"
            className="sticky-bar-primary"
            disabled={!renameValue.trim() || renameSaving}
            onClick={saveRename}
          >
            {t('common:save')}
          </button>
        </div>
      </BottomSheet>

      {/* Delete confirmation sheet */}
      <BottomSheet open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <h3 className="previous-chats-sheet-title">{t('agroAI:previousChats.deleteConfirmTitle')}</h3>
        <p className="previous-chats-sheet-body">{t('agroAI:previousChats.deleteConfirmBody')}</p>
        {actionError && <p className="previous-chats-error">{actionError}</p>}
        <div className="previous-chats-sheet-actions">
          <button type="button" className="sticky-bar-secondary" onClick={() => setDeleting(null)}>
            {t('common:cancel')}
          </button>
          <button type="button" className="sticky-bar-danger" disabled={deleteBusy} onClick={confirmDelete}>
            {t('agroAI:previousChats.delete')}
          </button>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
