import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { getProducts } from '../services/productService';
import { getStockReport } from '../services/stockService';
import { Table } from '../components/Table';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { getErrorMessage } from '../utils/getErrorMessage';
import { TRANSACTION_TYPES } from '../constants/apiConstants';

/**
 * GET /api/stock/report/
 * Filter: ?product_id=&transaction_type=&start_date=&end_date=&page=&page_size=
 * Returns paginated: { count, next, previous, results }
 */
export function StockReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount] = useState(0);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [filters, setFilters] = useState({
    product_id: '',
    transaction_type: '',
    start_date: '',
    end_date: '',
    page_size: '20',
  });

  // ── Load products for filter dropdown ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getProducts({ Active: true });
        setProducts(res.results || res);
      } catch (err) {
        // Silent fail
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  // ── Fetch report ───────────────────────────────────────────────────
  async function fetchReport() {
    setLoading(true);
    setError(null);

    try {
      const res = await getStockReport(filters);
      setData(res.results || []);
      setCount(res.count || 0);
      setNextUrl(res.next || null);
      setPrevUrl(res.previous || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  // ── Handle filter change ───────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((p) => ({
      ...p,
      [name]: value,
    }));
  };

  // ── Apply filters ──────────────────────────────────────────────────
  const applyFilters = () => {
    fetchReport();
  };

  // ── Pagination ─────────────────────────────────────────────────────
  const handlePage = async (url) => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const { default: api } = await import('../api');
      const rel = url.replace(/^https?:\/\/[^/]+/, '');
      const r = await api.get(rel);
      const body = r.data;

      setData(body.results || []);
      setCount(body.count || 0);
      setNextUrl(body.next || null);
      setPrevUrl(body.previous || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Compute running balance ────────────────────────────────────────
  const dataWithBalance = (() => {
    let balance = 0;

    return data.map((tx) => {
      if (tx.transaction_type === TRANSACTION_TYPES.PURCHASE) {
        balance += parseFloat(tx.quantity);
      } else if (tx.transaction_type === TRANSACTION_TYPES.SALE) {
        balance -= parseFloat(tx.quantity);
      }

      return {
        ...tx,
        runningBalance: balance.toFixed(2),
      };
    });
  })();

  // ── CSV Export ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Date & Time',
      'Product',
      'Sub-Variant',
      'Type',
      'Quantity',
      'Notes',
      'Running Balance',
    ];

    const rows = dataWithBalance.map((tx) => [
      new Date(tx.created_at).toLocaleString(),
      tx.product_name || '—',
      tx.sub_variant_sku || '—',
      tx.transaction_type,
      tx.quantity,
      tx.notes || '',
      tx.runningBalance,
    ]);

    const csv = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `stock-report-${
      new Date().toISOString().split('T')[0]
    }.csv`;

    a.click();
    URL.revokeObjectURL(url);

    toast.success('CSV exported');
  };

  // ── Table columns ──────────────────────────────────────────────────
  const columns = [
    {
      key: 'created_at',
      label: 'Date & Time',
      render: (v) =>
        v ? new Date(v).toLocaleString() : '—',
    },
    {
      key: 'product_name',
      label: 'Product',
    },
    {
      key: 'sub_variant_sku',
      label: 'Sub-Variant SKU',
    },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (v) => {
        const isPurchase =
          v === TRANSACTION_TYPES.PURCHASE;

        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900/70 px-2 py-1 text-[11px] font-medium text-zinc-300">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                isPurchase
                  ? 'bg-emerald-400/80'
                  : 'bg-red-400/80'
              }`}
              aria-hidden="true"
            />

            <span>
              
              {v}
            </span>
          </span>
        );
      },
    },
    {
      key: 'quantity',
      label: 'Qty',
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (v) => (
        <span className="text-zinc-400">
          {v || '—'}
        </span>
      ),
    },
    {
      key: 'runningBalance',
      label: 'Balance',
      render: (v) => (
        <span className="font-semibold tabular-nums text-zinc-200">
          {v}
        </span>
      ),
    },
  ];

  if (loading && data.length === 0) {
    return <LoadingSpinner />;
  }

  const fieldBaseClass =
    'w-full min-h-10 rounded-lg border border-zinc-700/80 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 hover:border-zinc-600 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-50';

  const selectClass = `${fieldBaseClass} appearance-none pr-9`;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* ── Page Header ───────────────────────────────────────────── */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-2xl"
              aria-hidden="true"
            >
              📄
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
                Stock Report
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                Review inventory movements, transaction history, and running stock balances.
              </p>
            </div>
          </div>
        </header>

        {/* ── Filter Panel ──────────────────────────────────────────── */}
        <section
          className="mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60"
          aria-labelledby="stock-report-filters"
        >
          {/* Filter Header */}
          <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4 sm:px-6">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/50 text-lg"
              aria-hidden="true"
            >
              🔍
            </div>

            <div>
              <h2
                id="stock-report-filters"
                className="text-sm font-semibold text-zinc-200"
              >
                Report Filters
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500">
                Narrow results by product, transaction type, or date range.
              </p>
            </div>
          </div>

          {/* Filter Fields */}
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Product */}
              <div>
                <label
                  htmlFor="product_id"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Product
                </label>

                <div className="relative">
                  <select
                    id="product_id"
                    name="product_id"
                    value={filters.product_id}
                    onChange={handleFilterChange}
                    disabled={productsLoading}
                    className={selectClass}
                  >
                    <option value="">
                      {productsLoading
                        ? 'Loading products...'
                        : 'All products'}
                    </option>

                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ProductCode} — {p.ProductName}
                      </option>
                    ))}
                  </select>

                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <label
                  htmlFor="transaction_type"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Transaction Type
                </label>

                <div className="relative">
                  <select
                    id="transaction_type"
                    name="transaction_type"
                    value={filters.transaction_type}
                    onChange={handleFilterChange}
                    className={selectClass}
                  >
                    <option value="">All types</option>

                    <option value={TRANSACTION_TYPES.PURCHASE}>
                      Purchase
                    </option>

                    <option value={TRANSACTION_TYPES.SALE}>
                      Sale
                    </option>

                    <option value={TRANSACTION_TYPES.ADJUSTMENT}>
                      Adjustment
                    </option>
                  </select>

                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor="start_date"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  From Date
                </label>

                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className={`${fieldBaseClass} [color-scheme:dark]`}
                />
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor="end_date"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  To Date
                </label>

                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className={`${fieldBaseClass} [color-scheme:dark]`}
                />
              </div>
            </div>

            {/* Filter Footer */}
            <div className="mt-5 flex flex-col gap-4 border-t border-zinc-800 pt-5 sm:flex-row sm:items-end sm:justify-between">
              {/* Page Size */}
              <div className="w-full sm:w-36">
                <label
                  htmlFor="page_size"
                  className="mb-1.5 block text-xs font-medium text-zinc-400"
                >
                  Results Per Page
                </label>

                <div className="relative">
                  <select
                    id="page_size"
                    name="page_size"
                    value={filters.page_size}
                    onChange={handleFilterChange}
                    className={selectClass}
                  >
                    <option value="10">10 rows</option>
                    <option value="20">20 rows</option>
                    <option value="50">50 rows</option>
                  </select>

                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 sm:w-auto"
                >
                  <span className="text-base">⬇</span>
                  Export CSV
                </button>

                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={loading}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-indigo-500/80 bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  ) : (
                    <span className="text-base">🔍</span>
                  )}

                  <span>
                    {loading ? 'Applying...' : 'Apply Filters'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Error State ───────────────────────────────────────────── */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────── */}
        {data.length === 0 && !loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
            <EmptyState message="No transactions found. Adjust filters." />
          </div>
        ) : (
          <section
            className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50"
            aria-labelledby="stock-report-results"
          >
            {/* Results Header */}
            <div className="flex flex-col gap-2 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2
                  id="stock-report-results"
                  className="text-sm font-semibold text-zinc-200"
                >
                  Transaction History
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Showing{' '}
                  <span className="font-medium text-zinc-300">
                    {data.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-zinc-300">
                    {count}
                  </span>{' '}
                  transactions
                </p>
              </div>

              {loading && (
                <div
                  className="flex items-center gap-2 text-xs text-zinc-500"
                  role="status"
                  aria-live="polite"
                >
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400"></div>
                  Updating report...
                </div>
              )}
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[850px]">
                <Table
                  columns={columns}
                  rows={dataWithBalance}
                />
              </div>
            </div>

            {/* Pagination */}
            {(nextUrl || prevUrl) && (
              <div className="flex flex-col gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <button
                  type="button"
                  onClick={() => handlePage(prevUrl)}
                  disabled={!prevUrl || loading}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <span className="text-base">‹</span>
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => handlePage(nextUrl)}
                  disabled={!nextUrl || loading}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  Next
                  <span className="text-base">›</span>
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}