/**
 * Usage in App.jsx:
 *   import { Toaster } from 'react-hot-toast';
 *   import { toastOptions } from './utils/toastConfig';
 *   ...
 *   <Toaster position="top-right" toastOptions={toastOptions} />
 */
export const toastOptions = {
  duration: 3500,
  style: {
    background: '#1F2937',
    color: '#F9FAFB',
    border: '1px solid #4B5563',
    borderRadius: '0.875rem',
    fontSize: '0.875rem',
    padding: '12px 16px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4)',
  },
  success: {
    iconTheme: { primary: '#22C55E', secondary: '#1F2937' },
    style: { border: '1px solid rgba(34,197,94,0.35)' },
  },
  error: {
    iconTheme: { primary: '#EF4444', secondary: '#1F2937' },
    style: { border: '1px solid rgba(239,68,68,0.35)' },
  },
};
