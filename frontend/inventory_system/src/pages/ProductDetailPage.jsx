import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import { getProduct } from '../services/productService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { getErrorMessage } from '../utils/getErrorMessage';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        const data = await getProduct(id);
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          toast.error(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();
    return () => { cancelled = true; };
  }, [id]);

  // ── Presentational helpers (same as ProductListPage) ────────────────
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

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-slate-950">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-4 py-16">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-slate-950">
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <ErrorMessage message={error} />
        </div>
      </main>
    );
  }

  if (!product) return null;

  return (
    <main className="min-h-[calc(100vh-64px)] overflow-x-hidden bg-slate-950">
      <div className="mx-auto w-full max-w-4xl min-w-0 px-3 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="mb-5 sm:mb-6">
          <p className="mb-1 break-words text-xs text-slate-500">
            <Link to="/products" className="hover:text-slate-300 transition-colors">Home</Link>
            {' / '}
            <Link to="/products" className="hover:text-slate-300 transition-colors">Products</Link>
            {' / '}
            <span className="text-slate-400">{product.ProductName}</span>
          </p>

          <div className="flex items-center justify-between gap-3">
            <h1 className="break-words text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
              {product.ProductName}
            </h1>

            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Products
            </button>
          </div>
        </div>

        {/* ── Detail Card ──────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6 rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm sm:p-6">
          {/* Image + Basic Info */}
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
              {product.ProductImage ? (
                <img
                  src={product.ProductImage}
                  alt="Product"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl text-slate-600">🖼️</span>
              )}
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 min-[480px]:grid-cols-2">
              {[
                ['Name', product.ProductName],
                ['Code', product.ProductCode],
                ['HSN Code', product.HSNCode || '—'],
                ['Total Stock', product.TotalStock ?? 0],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <p className="mb-0.5 text-xs text-slate-500">{k}</p>
                  <p className="break-words font-medium text-slate-100">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-5">
            <StatusBadge active={product.Active} />

            {product.IsFavourite && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300">
                <span className="text-amber-400">⭐</span>
                Favourite
              </span>
            )}
          </div>

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="min-w-0 border-t border-slate-800 pt-5">
              <h3 className="mb-3 font-semibold text-slate-100">Variants</h3>
              <div className="space-y-3">
                {product.variants.map((v) => (
                  <div key={v.id} className="min-w-0">
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
                ))}
              </div>
            </div>
          )}
        {/* Sub-Variants */}
        {product.sub_variants?.length > 0 && (
        <div className="min-w-0 border-t border-slate-800 pt-5">
            <h3 className="mb-3 font-semibold text-slate-100">Sub-Variants</h3>

            <div className="w-full max-w-full overflow-hidden rounded-lg border border-slate-800">
            
            {/* 
                UPDATED CONTAINER: 
                Added max-height, overflow, and custom WebKit scrollbar styles 
            */}
            <div className="w-full max-h-[380px] overflow-auto 
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-track]:bg-slate-900
                [&::-webkit-scrollbar-thumb]:bg-slate-700
                [&::-webkit-scrollbar-thumb]:rounded-full
                hover:[&::-webkit-scrollbar-thumb]:bg-slate-600"
            >
                <table className="w-full min-w-[420px] text-xs relative">
                <thead className="bg-slate-900 sticky top-0 z-10">
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
                    {product.sub_variants.map((sv) => (
                    <tr key={sv.id} className="border-t border-slate-800">
                        <td className="max-w-[180px] px-3 py-2 text-slate-100">
                        <span className="block truncate" title={sv.sku}>
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
                    ))}
                </tbody>
                </table>
            </div>

            </div>
        </div>
        )}
        </div>
      </div>
    </main>
  );
}