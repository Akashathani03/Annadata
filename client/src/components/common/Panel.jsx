import './Panel.css';

export default function Panel({ title, className = '', children }) {
  return (
    <div className={`panel ${className}`.trim()}>
      {title && <h4>{title}</h4>}
      {children}
    </div>
  );
}
