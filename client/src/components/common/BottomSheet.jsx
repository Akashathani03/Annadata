import './BottomSheet.css';

export default function BottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="bottom-sheet-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        {children}
      </div>
    </div>
  );
}
