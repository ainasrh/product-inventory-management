/**
 * Product Statistics Cards
 * Displays aggregated product metrics
 */

export function ProductStats({ stats }) {
  const { totalCount, activeCount, lowStockCount } = stats;

  return (
    <section
      className="mb-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mb-6 sm:gap-4 lg:grid-cols-3"
      aria-label="Product statistics"
    >
      <StatCard label="Total Products" value={totalCount} />
      <StatCard label="Active Products" value={activeCount} />
      <StatCard
        label="Low Stock (<10)"
        value={lowStockCount}
        className="min-[480px]:col-span-2 lg:col-span-1"
      />
    </section>
  );
}

/**
 * Individual stat card component
 */
function StatCard({ label, value, className = '' }) {
  return (
    <div
      className={`min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-5 ${className}`}
    >
      <p className="mb-1 break-words text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-slate-100 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}
