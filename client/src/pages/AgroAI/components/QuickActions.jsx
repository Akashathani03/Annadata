import './QuickActions.css';

// Extracted from EmptyState (was previously inline) to actually be the
// reusable, generic component this app's architecture already assumed
// existed. Zero business logic - it only ever calls onAction with the
// tapped action object; deciding what happens next (Step 11: convert
// to a user message) is entirely the caller's responsibility.
//
// actions: Array<{ id, icon: ComponentType, label: string }>
export default function QuickActions({ actions = [], onAction }) {
  if (actions.length === 0) return null;

  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className="quick-action-btn"
          onClick={() => onAction?.(action)}
        >
          {action.icon && <action.icon size={17} strokeWidth={2} aria-hidden="true" />}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
