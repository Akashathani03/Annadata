import './BackLink.css';

export default function BackLink({ label, onClick }) {
  return (
    <button className="ui-back-link" onClick={onClick}>
      ← {label}
    </button>
  );
}
