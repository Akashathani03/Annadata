import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Toast from '../components/common/Toast';

const ToastContext = createContext(null);

// One shared toast instance for the entire app - every module calls
// useToast() instead of window.alert() or building its own popup.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { message, key }
  const timerRef = useRef(null);
  const keyRef = useRef(0);

  const showToast = useCallback((message) => {
    keyRef.current += 1;
    setToast({ message, key: keyRef.current });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toast={toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
