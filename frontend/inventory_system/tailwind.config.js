/** 
 * Merge this into your existing tailwind.config.js.
 * Only the `theme.extend` block is new — everything else in your
 * current config (content paths, plugins, etc.) stays as-is.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#111827',
        surface: '#1F2937',
        card: '#374151',
        border: '#4B5563',
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        success: { DEFAULT: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
        warning: { DEFAULT: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
        danger:  { DEFAULT: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
        text: {
          DEFAULT: '#F9FAFB',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)',
        elevated: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4)',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.25s ease-out',
        slideDown: 'slideDown 0.2s ease-out',
      },
    },
  },
  plugins: [],
};