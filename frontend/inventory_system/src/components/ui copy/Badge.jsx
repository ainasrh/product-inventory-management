/**
 * tone: 'success' | 'warning' | 'danger' | 'accent' | 'neutral'
 */
export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    danger: 'bg-danger-bg text-danger',
    accent: 'bg-accent/15 text-accent',
    neutral: 'bg-border/40 text-text-muted',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
