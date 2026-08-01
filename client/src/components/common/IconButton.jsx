import './IconButton.css';

// One consistent circular touch-target for every icon-only button in
// the app - back, menu, notifications, etc. Fixes point 2 (consistent
// size/spacing/touch targets) architecturally, not per-screen.
export default function IconButton({ icon: Icon, onClick, label, size = 'default', active = false }) {
  return (
    <button
      type="button"
      className={`icon-btn icon-btn-${size}${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      <Icon size={size === 'small' ? 18 : 20} strokeWidth={2} />
    </button>
  );
}
