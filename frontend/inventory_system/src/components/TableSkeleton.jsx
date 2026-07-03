export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-card">
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 animate-pulse">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 rounded bg-card"
                style={{ width: c === 0 ? '10%' : `${100 / cols}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
