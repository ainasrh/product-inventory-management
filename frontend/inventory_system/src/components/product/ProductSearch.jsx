/**
 * Product Search Input
 * Debounced search field for filtering products
 */

export function ProductSearch({ value, onChange }) {
  return (
    <section className="mb-4 sm:mb-5" aria-label="Product search">
      <div className="relative w-full sm:max-w-md">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        >
          🔍
        </span>

        <input
          type="text"
          placeholder="Search by name, code or HSN…"
          value={value}
          onChange={onChange}
          aria-label="Search products"
          className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
    </section>
  );
}
