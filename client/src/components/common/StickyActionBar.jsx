import './StickyActionBar.css';

export default function StickyActionBar({ secondaryLabel, onSecondary, primaryLabel, onPrimary, primaryLoading }) {
  return (
    <>
      <button className="sticky-bar-secondary" onClick={onSecondary}>{secondaryLabel}</button>
      <button className="sticky-bar-primary" onClick={onPrimary} disabled={primaryLoading}>
        {primaryLabel}
      </button>
    </>
  );
}
