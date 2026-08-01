import { IconChevronDown } from '../icons';
import './ExpandableSection.css';

// Generic, reusable collapse/expand pattern (per Step 1's note: this
// lives in components/common/, not page-local to Agro AI, since any
// future card type could reuse it). Fully controlled - owns no state
// of its own, so a parent (e.g. DiagnosisCard) can persist expanded
// state alongside its other message data if needed later.
export default function ExpandableSection({ label, expanded, onToggle, children }) {
  return (
    <div className="expandable-section">
      <button
        type="button"
        className="expandable-section-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <IconChevronDown
          size={14}
          strokeWidth={2}
          className={`expandable-section-chevron${expanded ? ' is-expanded' : ''}`}
          aria-hidden="true"
        />
        <span>{label}</span>
      </button>
      {expanded && <div className="expandable-section-content">{children}</div>}
    </div>
  );
}
