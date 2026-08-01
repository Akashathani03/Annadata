import './PriceBox.css';

export function PriceGrid({ children }) {
  return <div className="ui-price-grid">{children}</div>;
}

export function PriceBox({ label, value, unitLabel, tone, highlight, tag }) {
  return (
    <div className={`ui-price-box${highlight ? ' ui-price-box-highlight' : ''}`}>
      <span>{label}</span>
      <b className={`ui-price-${tone}`}>₹{value}</b>
      <small>{unitLabel}</small>
      {tag && <div className="ui-price-tag">{tag}</div>}
    </div>
  );
}
