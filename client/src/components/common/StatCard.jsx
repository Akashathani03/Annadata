import './StatCard.css';

export default function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{icon} {label}</div>
      <b>{value}</b>
    </div>
  );
}
