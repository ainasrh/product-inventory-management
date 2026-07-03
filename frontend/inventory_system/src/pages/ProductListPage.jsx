import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  getProducts,
  getProduct,
  updateProduct,
} from '../services/productService';

import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { getErrorMessage } from '../utils/getErrorMessage';
import { AuthContext } from '../context/AuthContext';

export function ProductListPage() {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount] = useState(0);

  // Search
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  // Detail modal
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Toggle Active/Inactive modal
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────
  async function fetchProducts(params = {}) {
    setLoading(true);
    setError(null);

    try {
      const res = await getProducts({
        search,
        ...params,
      });

      // DRF paginated: { count, next, previous, results }
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
    fetchProducts();
  }, []);

  // Debounced search
  const handleSearch = (e) => {
    const val = e.target.value;

    setSearch(val);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchProducts({ search: val });
    }, 400);
  };

  // Paginate using the full URL returned by DRF
  const handlePage = async (url) => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const rel = url.replace(/^https?:\/\/[^/]+/, '');
      const { default: api } = await import('../api');
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

  // ── Detail modal ───────────────────────────────────────────────────
  const openDetail = async (product) => {
    setDetailProduct(product);
    setDetailLoading(true);

    try {
      const full = await getProduct(product.id);
      setDetailProduct(full);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Toggle Active/Inactive ─────────────────────────────────────────
  const confirmToggle = async () => {
    if (!toggleTarget) return;

    setToggling(true);

    try {
      const newActiveStatus = !toggleTarget.Active;

      await updateProduct(toggleTarget.id, {
        Active: newActiveStatus,
      });

      toast.success(
        `Product ${
          newActiveStatus ? 'activated' : 'deactivated'
        } successfully`
      );

      setToggleTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  // ── Presentational helpers ─────────────────────────────────────────
  const Dot = ({ tone }) => {
    const tones = {
      success: 'bg-emerald-500',
      danger: 'bg-rose-500',
      warning: 'bg-amber-500',
      neutral: 'bg-slate-500',
    };

    return (
      <span
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tones[tone]}`}
        aria-hidden="true"
      />
    );
  };

  const StatusBadge = ({ active }) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300">
      <Dot tone={active ? 'success' : 'neutral'} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const StockBadge = ({ stock }) => {
    const tone =
      stock === 0
        ? 'danger'
        : stock < 10
          ? 'warning'
          : 'success';

    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300">
        <Dot tone={tone} />
        <span className="tabular-nums">{stock}</span>
        <span>in stock</span>
      </span>
    );
  };

  // ── Table columns ──────────────────────────────────────────────────
  const columns = [
    {
      key: 'ProductImage',
      label: 'Image',
      sortDisabled: true,
      render: (v) => (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-700 bg-slate-800">
          {v ? (
            <img
              src={v}
              alt="Product"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-slate-600 text-lg">🖼️</span>
          )}
        </div>
      ),
    },
    {
      key: 'ProductName',
      label: 'Name',
      render: (v, row) => (
        <div className="flex min-w-0 max-w-[180px] items-center gap-1.5 sm:max-w-[220px]">
          <span
            className="truncate font-medium text-slate-100"
            title={v}
          >
            {v}
          </span>

          {row.IsFavourite && (
            <span className="text-amber-400">⭐</span>
          )}
        </div>
      ),
    },
    {
      key: 'ProductCode',
      label: 'Code',
      render: (v) => (
        <span
          className="block max-w-[150px] truncate text-slate-400"
          title={v}
        >
          {v}
        </span>
      ),
    },
    {
      key: 'HSNCode',
      label: 'HSN',
      render: (v) =>
        v ? (
          <span
            className="inline-block max-w-[130px] truncate rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300"
            title={v}
          >
            {v}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
    {
      key: 'TotalStock',
      label: 'Stock',
      render: (v) => (
        <StockBadge stock={v ?? 0} />
      ),
    },
    {
      key: 'Active',
      label: 'Status',
      render: (v) => (
        <StatusBadge active={v} />
      ),
    },
    {
      key: 'CreatedDate',
      label: 'Created',
      render: (v) => (
        <span className="whitespace-nowrap text-sm text-slate-400">
          {v
            ? new Date(v).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortDisabled: true,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openDetail(row)}
            aria-label={`View ${row.ProductName}`}
            title="View"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="text-base">👁️</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/products/${row.id}/edit`)
            }
            aria-label={`Edit ${row.ProductName}`}
            title="Edit"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="text-base">✏️</span>
          </button>

          <button
            type="button"
            onClick={() => setToggleTarget(row)}
            aria-label={
              row.Active
                ? `Deactivate ${row.ProductName}`
                : `Activate ${row.ProductName}`
            }
            title={
              row.Active
                ? 'Deactivate'
                : 'Activate'
            }
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              row.Active
                ? 'text-slate-400 hover:border-slate-700 hover:bg-slate-800/70 hover:text-rose-400'
                : 'text-slate-400 hover:border-slate-700 hover:bg-slate-800/70 hover:text-emerald-400'
            }`}
          >
            <span className="text-base">{row.Active ? '🔴' : '🟢'}</span>
          </button>
        </div>
      ),
    },
  ];

  const activeCount = data.filter(
    (p) => p.Active
  ).length;

  const lowStockCount = data.filter(
    (p) => (p.TotalStock ?? 0) < 10
  ).length;

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] overflow-x-hidden bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-8 xl:px-8">
          <ErrorMessage message={error} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] overflow-x-hidden bg-slate-950">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-3 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-8 xl:px-8">
        {/* ── Header ───────────────────────────────────────────────── */}
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
              onClick={() =>
                navigate('/products/new')
              }
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
            >
              <span className="text-base">+</span>
              New Product
            </button>
          </div>
        </header>

        {/* ── Stat Cards ───────────────────────────────────────────── */}
        <section
          className="mb-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mb-6 sm:gap-4 lg:grid-cols-3"
          aria-label="Product statistics"
        >
          <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <p className="mb-1 break-words text-xs text-slate-500">
              Total Products
            </p>

            <p className="text-xl font-semibold tabular-nums text-slate-100 sm:text-2xl">
              {count}
            </p>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <p className="mb-1 break-words text-xs text-slate-500">
              Active Products
            </p>

            <p className="text-xl font-semibold tabular-nums text-slate-100 sm:text-2xl">
              {activeCount}
            </p>
          </div>

          <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-5 min-[480px]:col-span-2 lg:col-span-1">
            <p className="mb-1 break-words text-xs text-slate-500">
              Low Stock (&lt;10)
            </p>

            <p className="text-xl font-semibold tabular-nums text-slate-100 sm:text-2xl">
              {lowStockCount}
            </p>
          </div>
        </section>

        {/* ── Search ───────────────────────────────────────────────── */}
        <section
          className="mb-4 sm:mb-5"
          aria-label="Product search"
        >
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
              value={search}
              onChange={handleSearch}
              aria-label="Search products"
              className="min-h-11 w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </section>

        {/* ── Product Results ──────────────────────────────────────── */}
        <section className="min-w-0">
          {loading ? (
            <div
              className="flex min-h-48 items-center justify-center py-10 sm:py-12"
              role="status"
              aria-live="polite"
            >
              <LoadingSpinner />
            </div>
          ) : data.length === 0 ? (
            <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
              <EmptyState
                message="No products found. Create your first product to get started."
                actionLabel="Create Product"
                onAction={() =>
                  navigate('/products/new')
                }
              />
            </div>
          ) : (
            <>
              {/*
                Table owns horizontal scrolling.
                min-w-0 prevents this flex/grid descendant
                from expanding the entire page width.
              */}
              <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl">
                <Table
                  columns={columns}
                  rows={data}
                  sortable
                  getRowKey={(r) => r.id}
                />
              </div>

              {/* ── Pagination ─────────────────────────────────────── */}
              <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="break-words text-xs text-slate-500">
                  {count} total product
                  {count === 1 ? '' : 's'}
                </p>

                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      handlePage(prevUrl)
                    }
                    disabled={!prevUrl}
                    className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
                  >
                    <span className="text-base">‹</span>
                    <span className="truncate">
                      Previous
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePage(nextUrl)
                    }
                    disabled={!nextUrl}
                    className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5"
                  >
                    <span className="truncate">
                      Next
                    </span>

                    <span className="text-base">›</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Detail Modal ─────────────────────────────────────────── */}
        <Modal
          isOpen={!!detailProduct}
          onClose={() =>
            setDetailProduct(null)
          }
          title="Product Detail"
          maxWidth="max-w-2xl"
        >
          {detailLoading ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : (
            detailProduct && (
              <div className="min-w-0 space-y-5 text-sm">
                {/* Image + Basic Info */}
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                    {detailProduct.ProductImage ? (
                      <img
                        src={detailProduct.ProductImage}
                        alt="Product"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-600 text-xl">🖼️</span>
                    )}
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                    {[
                      [
                        'Name',
                        detailProduct.ProductName,
                      ],
                      [
                        'Code',
                        detailProduct.ProductCode,
                      ],
                      [
                        'HSN Code',
                        detailProduct.HSNCode || '—',
                      ],
                      [
                        'Total Stock',
                        detailProduct.TotalStock ?? 0,
                      ],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="min-w-0"
                      >
                        <p className="mb-0.5 text-xs text-slate-500">
                          {k}
                        </p>

                        <p className="break-words font-medium text-slate-100">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    active={detailProduct.Active}
                  />

                  {detailProduct.IsFavourite && (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300">
                      <span className="text-amber-400">⭐</span>
                      Favourite
                    </span>
                  )}
                </div>

                {/* Variants */}
                {detailProduct.variants?.length > 0 && (
                  <div className="min-w-0">
                    <h3 className="mb-2 font-semibold text-slate-100">
                      Variants
                    </h3>

                    <div className="space-y-3">
                      {detailProduct.variants.map(
                        (v) => (
                          <div
                            key={v.id}
                            className="min-w-0"
                          >
                            <p className="mb-1.5 break-words text-xs font-medium text-slate-400">
                              {v.name}
                            </p>

                            <div className="flex min-w-0 flex-wrap gap-1.5">
                              {v.options.map((o) => (
                                <span
                                  key={o.id}
                                  className="max-w-full break-words rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300"
                                >
                                  {o.value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Variants */}
                {detailProduct.sub_variants?.length >
                  0 && (
                  <div className="min-w-0">
                    <h3 className="mb-2 font-semibold text-slate-100">
                      Sub-Variants
                    </h3>

                    <div className="w-full max-w-full overflow-hidden rounded-lg border border-slate-800">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[420px] text-xs">
                          <thead className="bg-slate-900">
                            <tr>
                              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500">
                                SKU
                              </th>

                              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500">
                                Stock
                              </th>

                              <th className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500">
                                Price
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {detailProduct.sub_variants.map(
                              (sv) => (
                                <tr
                                  key={sv.id}
                                  className="border-t border-slate-800"
                                >
                                  <td className="max-w-[180px] px-3 py-2 text-slate-100">
                                    <span
                                      className="block truncate"
                                      title={sv.sku}
                                    >
                                      {sv.sku}
                                    </span>
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-100">
                                    {sv.stock}
                                  </td>

                                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-100">
                                    {sv.price ?? '—'}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </Modal>

        {/* ── Toggle Active/Inactive Modal ─────────────────────────── */}
        <Modal
          isOpen={!!toggleTarget}
          onClose={() =>
            setToggleTarget(null)
          }
          title={
            toggleTarget?.Active
              ? 'Deactivate Product'
              : 'Activate Product'
          }
        >
          <div className="min-w-0">
            <p className="mb-5 break-words text-sm leading-6 text-slate-400">
              {toggleTarget?.Active ? (
                <>
                  Deactivate{' '}
                  <strong className="break-words text-slate-100">
                    {toggleTarget?.ProductName}
                  </strong>
                  ?
                  <br />
                  The product will be marked as
                  inactive and hidden from active
                  listings.
                </>
              ) : (
                <>
                  Activate{' '}
                  <strong className="break-words text-slate-100">
                    {toggleTarget?.ProductName}
                  </strong>
                  ?
                  <br />
                  The product will be marked as
                  active and visible in active
                  listings.
                </>
              )}
            </p>

            <div className="flex flex-col-reverse gap-2 min-[480px]:flex-row min-[480px]:gap-3">
              <button
                type="button"
                onClick={confirmToggle}
                disabled={toggling}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-[480px]:flex-1"
              >
                {toggling
                  ? 'Processing…'
                  : toggleTarget?.Active
                    ? 'Deactivate'
                    : 'Activate'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setToggleTarget(null)
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-700 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-[480px]:flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </main>
  );
}