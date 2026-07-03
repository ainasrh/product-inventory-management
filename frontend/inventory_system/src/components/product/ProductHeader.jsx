/**
 * Product List Page Header
 * Displays breadcrumb and "New Product" action button
 */

export function ProductHeader({ onCreateNew }) {
  return (
    <header className="mb-5 sm:mb-6 lg:mb-7">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 break-words text-xs text-slate-500">
            Home / Products
          </p>

          <h1 className="break-words text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
            Products
          </h1>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
        >
          <span className="text-base">+</span>
          New Product
        </button>
      </div>
    </header>
  );
}
