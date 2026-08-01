import './Modal.css';

export default function Modal({ open, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop-el open" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`modal-box-el${wide ? ' wide' : ''}`}>
        {onClose && (
          <button className="modal-close-el" onClick={onClose} aria-label="Close">✕</button>
        )}
        {children}
      </div>
    </div>
  );
}
