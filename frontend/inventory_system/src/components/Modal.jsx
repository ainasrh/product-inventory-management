import { useEffect, useRef } from 'react';

/** Same API as before: isOpen, onClose, title, maxWidth, children */
export function Modal({ isOpen, onClose, title, maxWidth = 'max-w-lg', children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto scrollbar-thin bg-surface border border-border rounded-xl shadow-elevated animate-slideUp focus:outline-none`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface/95 backdrop-blur-sm z-10">
          <h2 id="modal-title" className="font-semibold text-text text-base">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg p-1.5 transition text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
