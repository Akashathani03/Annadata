import { IconLeaf, IconCamera } from '../../../components/icons';
import QuickActions from './QuickActions';
import './EmptyState.css';

// Purely presentational (per Step 5 scope) - every piece of dynamic
// content arrives via props. This component has no knowledge of Agro
// AI's config, translations, or chat state; whoever mounts it later is
// responsible for resolving quickActions' icons and all text, the same
// separation of concerns already established for ChatInput in Step 4.
//
// quickActions:   Array<{ id, icon: ComponentType, label: string }>
// examplePrompts: Array<string>
//
// `examplesLabel` (e.g. "Try asking") isn't in the originally suggested
// prop list but is added here to stay text-driven rather than
// hardcoding it - matches "no hardcoded text" while still reproducing
// the locked design exactly. Optional, since a caller may not need it.
export default function EmptyState({
  userName,
  greeting,
  introduction,
  quickActions = [],
  examplePrompts = [],
  examplesLabel,
  uploadHint,
  onQuickAction,
  onExampleClick,
}) {
  return (
    <div className="agroai-empty-state">
      <div className="agroai-empty-badge" aria-hidden="true">
        <IconLeaf size={22} strokeWidth={2} />
      </div>

      <p className="agroai-empty-greeting">
        {greeting}
        {userName ? `, ${userName}` : ''}
      </p>

      {introduction && <p className="agroai-empty-intro">{introduction}</p>}

      {quickActions.length > 0 && (
        <QuickActions actions={quickActions} onAction={onQuickAction} />
      )}

      {examplePrompts.length > 0 && (
        <div className="agroai-empty-examples">
          {examplesLabel && <p className="agroai-empty-examples-label">{examplesLabel}</p>}
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="agroai-example-chip"
              onClick={() => onExampleClick?.(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {uploadHint && (
        <p className="agroai-empty-upload-hint">
          <IconCamera size={13} strokeWidth={2} aria-hidden="true" />
          <span>{uploadHint}</span>
        </p>
      )}
    </div>
  );
}
