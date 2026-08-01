import './SegmentedTabs.css';

export default function SegmentedTabs({ tabs, activeKey, onChange }) {
  return (
    <div className="segmented-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={tab.key === activeKey ? 'active' : ''}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
