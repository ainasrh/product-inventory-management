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
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount]     = useState(0);

  const [products, setProducts]           = useState([]);
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
    setFilters((p) => ({ ...p, [name]: value }));
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
      return { ...tx, runningBalance: balance.toFixed(2) };
    });
  })();

  // ── CSV Export ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (data.length === 0) { toast.error('No data to export'); return; }

    const headers = ['Date & Time', 'Product', 'Sub-Variant', 'Type', 'Quantity', 'Notes', 'Running Balance'];
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
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // ── Table columns ──────────────────────────────────────────────────
  const columns = [
    {
      key: 'created_at', label: 'Date & Time',
      render: (v) => v ? new Date(v).toLocaleString() : '—',
    },
    { key: 'product_name', label: 'Product' },
    { key: 'sub_variant_sku', label: 'Sub-Variant SKU' },
    {
      key: 'transaction_type', label: 'Type',
      render: (v) => v === TRANSACTION_TYPES.PURCHASE
        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">+{v}</span>
        : <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">−{v}</span>,
    },
    { key: 'quantity', label: 'Qty' },
    { key: 'notes', label: 'Notes' },
    {
      key: 'runningBalance', label: 'Balance',
      render: (v) => <strong>{v}</strong>,
    },
  ];

  if (loading && data.length === 0) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Stock Report</h1>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4 text-sm">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Product */}
          <div>
            <label htmlFor="product_id" className="block text-xs font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              id="product_id"
              name="product_id"
              value={filters.product_id}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.ProductCode} — {p.ProductName}</option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label htmlFor="transaction_type" className="block text-xs font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="transaction_type"
              name="transaction_type"
              value={filters.transaction_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value={TRANSACTION_TYPES.PURCHASE}>Purchase</option>
              <option value={TRANSACTION_TYPES.SALE}>Sale</option>
              <option value={TRANSACTION_TYPES.ADJUSTMENT}>Adjustment</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-xs font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="end_date" className="block text-xs font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Page Size */}
        <div className="flex gap-4 items-end mb-4">
          <div className="w-32">
            <label htmlFor="page_size" className="block text-xs font-medium text-gray-700 mb-1">
              Per Page
            </label>
            <select
              id="page_size"
              name="page_size"
              value={filters.page_size}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Apply Filters
            </button>
            <button onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────── */}
      {error && <ErrorMessage message={error} />}

      {data.length === 0 && !loading ? (
        <EmptyState message="No transactions found. Adjust filters." />
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-3">Showing {data.length} of {count} transactions</div>
          <Table columns={columns} rows={dataWithBalance} />

          {/* Pagination */}
          {(nextUrl || prevUrl) && (
            <div className="flex items-center justify-between mt-4 text-sm gap-2">
              <button onClick={() => handlePage(prevUrl)} disabled={!prevUrl}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Previous
              </button>
              <button onClick={() => handlePage(nextUrl)} disabled={!nextUrl}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
