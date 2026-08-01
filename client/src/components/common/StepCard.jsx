import './StepCard.css';

export default function StepCard({ number, title, children }) {
  return (
    <div className="step-card">
      <div className="step-card-head">
        <span className="step-card-num">{number}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  );
}
