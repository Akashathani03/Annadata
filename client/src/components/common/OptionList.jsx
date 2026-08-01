import './OptionList.css';

export default function OptionList({ options, activeId, onChange }) {
  return (
    <div className="option-list">
      {options.map((opt) => (
        <div
          key={opt.id}
          className={`option-list-item${opt.id === activeId ? ' active' : ''}`}
          onClick={() => onChange(opt.id)}
        >
          <span>{opt.label}</span>
          <span className="option-list-dot" />
        </div>
      ))}
    </div>
  );
}
