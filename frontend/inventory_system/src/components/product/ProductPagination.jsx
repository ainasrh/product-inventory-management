/**
 * Product List Pagination
 * Previous/Next navigation with result count
 */

export function ProductPagination({
  totalCount,
  nextUrl,
  prevUrl,
  onNext,
  onPrevious,
}) {
  return (
    <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="break-words text-xs text-slate-500">
        {totalCount} total product{totalCount === 1 ? '' : 's'}
      </p>

      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!prevUrl}
          className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
        >
          <span className="text-base">‹</span>
          <span className="truncate">Previous</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!nextUrl}
          className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
        >
          <span className="truncate">Next</span>
          <span className="text-base">›</span>
        </button>
      </div>
    </div>
  );
}
