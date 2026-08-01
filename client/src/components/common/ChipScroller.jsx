import './ChipScroller.css';

export default function ChipScroller({ options, activeId, onChange }) {
  return (
    <div className="chip-scroller">
      {options.map((opt) => (
        <div
          key={opt.id}
          className={`chip-scroller-item${opt.id === activeId ? ' active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          {opt.icon} {opt.label}
        </div>
      ))}
    </div>
  );
}
