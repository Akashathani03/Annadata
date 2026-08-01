import './Toast.css';

// Prototype's notify() uses one single toast style for every message -
// including validation errors ("Please enter a valid quantity.") - so
// this component intentionally does not vary style by message type.
export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div id="toast-root" role="status" key={toast.key}>
      {toast.message}
    </div>
  );
}
