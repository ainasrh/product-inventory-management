export function Card({ children, className = '', hover = false, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`bg-surface border border-border rounded-xl shadow-card p-5 sm:p-6 transition-all duration-200 ${
        hover ? 'hover:shadow-elevated hover:-translate-y-0.5 hover:border-accent/40' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Small stat card for dashboard-style headers, e.g. "Total Products: 128" */
export function StatCard({ label, value, icon: Icon, tone = 'accent' }) {
  const tones = {
    accent: 'bg-accent/15 text-accent',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    danger: 'bg-danger-bg text-danger',
  };

  return (
    <Card hover className="flex items-center gap-4 animate-slideUp">
      {Icon && (
        <div className={`w-11 h-11 shrink-0 rounded-xl grid place-items-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-text-muted truncate">{label}</p>
        <p className="text-xl font-semibold text-text truncate">{value}</p>
      </div>
    </Card>
  );
}
