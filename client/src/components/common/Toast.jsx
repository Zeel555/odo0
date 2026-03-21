import { useState, useEffect, useCallback } from 'react';

/** Global toast show function — call showToast(message) from anywhere */
let _showToast = null;
export const showToast = (msg) => { if (_showToast) _showToast(msg); };

/**
 * ToastProvider — mount once in App.jsx, above routes.
 * Renders a fixed bottom-right toast that auto-dismisses after 3s.
 */
const ToastProvider = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _showToast = (msg) => {
      const id = Date.now();
      setToasts((t) => [...t, { id, msg }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
    };
    return () => { _showToast = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(({ id, msg }) => (
        <div key={id} style={{
          background: '#EAF6FB', border: '1.5px solid #0077B6',
          color: '#03045E', borderRadius: 8,
          padding: '10px 16px', fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,119,182,0.12)',
          animation: 'fadeUp 0.25s ease',
          maxWidth: 340,
        }}>
          {msg}
        </div>
      ))}
    </div>
  );
};

export default ToastProvider;
