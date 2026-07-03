import { Loader2 } from 'lucide-react';

/**
 * variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
 * size: 'sm' | 'md'
 * icon: optional lucide icon component, rendered before children
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
  };

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white shadow-card',
    secondary: 'bg-card hover:bg-border text-text border border-border',
    danger: 'bg-danger hover:bg-danger/90 text-white shadow-card',
    success: 'bg-success hover:bg-success/90 text-white shadow-card',
    ghost: 'bg-transparent hover:bg-card text-text-muted hover:text-text',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      {children}
    </button>
  );
}
