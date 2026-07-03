
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { getProducts, getSubVariants } from '../services/productService';
import { purchaseStock, saleStock } from '../services/stockService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getErrorMessage } from '../utils/getErrorMessage';
import { validateStockForm } from '../utils/validators';
import { TRANSACTION_TYPES } from '../constants/apiConstants';

/**
 * POST /api/stock/purchase/  or  /api/stock/sale/
 * Body: { sub_variant_id, quantity, notes }
 */
export function StockManagementPage() {
  const [txnType, setTxnType] = useState(TRANSACTION_TYPES.PURCHASE);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [subVariants, setSubVariants] = useState([]);
  const [subVariantsLoading, setSubVariantsLoading] = useState(false);

  const [form, setForm] = useState({
    product_id: '',
    sub_variant_id: '',
    quantity: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Load products on mount ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getProducts({ Active: true });
        setProducts(res.results || res);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setProductsLoading(false);
      }
    })();
  }, []);

  // ── Load sub-variants when product changes ─────────────────────────
  useEffect(() => {
    if (!form.product_id) {
      setSubVariants([]);
      setForm((p) => ({ ...p, sub_variant_id: '' }));
      return;
    }

    (async () => {
      setSubVariantsLoading(true);

      try {
        const res = await getSubVariants(form.product_id);
        setSubVariants(res.results || res);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setSubVariantsLoading(false);
      }
    })();
  }, [form.product_id]);

  // ── Field change ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => ({
      ...p,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((p) => ({
        ...p,
        [name]: null,
      }));
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const selectedSV = subVariants.find(
      (sv) => sv.id === form.sub_variant_id
    );

    const available = selectedSV?.stock ?? 0;

    // Only cap quantity against available stock for SALE — purchases
    // are additive and have no upper bound tied to current stock.
    const { isValid, errors: ve } = validateStockForm(
      form,
      txnType === TRANSACTION_TYPES.SALE ? available : Infinity
    );

    if (!isValid) {
      setErrors(ve);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        sub_variant_id: form.sub_variant_id,
        quantity: parseFloat(form.quantity),
        notes: form.notes,
      };

      if (txnType === TRANSACTION_TYPES.PURCHASE) {
        await purchaseStock(payload);
        toast.success('Stock added successfully');
      } else {
        await saleStock(payload);
        toast.success('Stock removed successfully');
      }

      // Reset
      setForm((p) => ({
        ...p,
        sub_variant_id: '',
        quantity: '',
        notes: '',
      }));

      // Refetch sub-variants to show updated stock
      if (form.product_id) {
        const res = await getSubVariants(form.product_id);
        setSubVariants(res.results || res);
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (productsLoading) {
    return <LoadingSpinner />;
  }

  const isPurchase = txnType === TRANSACTION_TYPES.PURCHASE;

  const selectedSubVariant = subVariants.find(
    (sv) => sv.id === form.sub_variant_id
  );

  const fieldBaseClass =
    'w-full rounded-lg border bg-zinc-950/60 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 disabled:cursor-not-allowed disabled:bg-zinc-900/40 disabled:text-zinc-600';

  const normalFieldClass = 'border-zinc-700/80 hover:border-zinc-600';

  const errorFieldClass =
    'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/10';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* ── Page Header ───────────────────────────────────────────── */}
        <header className="mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-2xl"
              aria-hidden="true"
            >
              📦
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
                Stock Management
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                Adjust inventory levels and maintain accurate stock records.
              </p>
            </div>
          </div>
        </header>

        {/* ── Transaction Type Selector ─────────────────────────────── */}
        <section
          className="mb-5"
          aria-label="Stock transaction type"
        >
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1">
            <button
              type="button"
              onClick={() => setTxnType(TRANSACTION_TYPES.PURCHASE)}
              aria-pressed={isPurchase}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                isPurchase
                  ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                  : 'border border-transparent text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
              }`}
            >
              <span className={`text-lg ${isPurchase ? 'opacity-100' : 'opacity-50'}`}>+</span>
              <span>Add Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setTxnType(TRANSACTION_TYPES.SALE)}
              aria-pressed={!isPurchase}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                !isPurchase
                  ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                  : 'border border-transparent text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
              }`}
            >
              <span className={`text-lg ${!isPurchase ? 'opacity-100' : 'opacity-50'}`}>−</span>
              <span>Sell Stock</span>
            </button>
          </div>
        </section>

        {/* ── Main Form Panel ───────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60"
        >
          {/* Panel Header */}
          <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-zinc-200">
              {isPurchase ? 'Add inventory stock' : 'Remove inventory stock'}
            </h2>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {isPurchase
                ? 'Select a product variant and enter the quantity to add.'
                : 'Select a product variant and enter the quantity to remove.'}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5 p-5 sm:p-6">
            {/* Product */}
            <div>
              <label
                htmlFor="product_id"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Product
                <span
                  className="ml-1 text-zinc-500"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <div className="relative">
                <select
                  id="product_id"
                  name="product_id"
                  value={form.product_id}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.product_id)}
                  aria-describedby={
                    errors.product_id ? 'product_id-error' : undefined
                  }
                  className={`${fieldBaseClass} appearance-none pr-10 ${
                    errors.product_id
                      ? errorFieldClass
                      : normalFieldClass
                  }`}
                >
                  <option value="">Select a product</option>

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

              {errors.product_id && (
                <p
                  id="product_id-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-400/90"
                >
                  {errors.product_id}
                </p>
              )}
            </div>

            {/* Sub-Variant */}
            <div>
              <label
                htmlFor="sub_variant_id"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Sub-Variant
                <span
                  className="ml-1 text-zinc-500"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              {subVariantsLoading ? (
                <div
                  className="flex min-h-[42px] items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3.5 text-sm text-zinc-500"
                  role="status"
                  aria-live="polite"
                >
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400"></div>
                  <span>Loading sub-variants...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="sub_variant_id"
                    name="sub_variant_id"
                    value={form.sub_variant_id}
                    onChange={handleChange}
                    disabled={!form.product_id}
                    aria-invalid={Boolean(errors.sub_variant_id)}
                    aria-describedby={
                      errors.sub_variant_id
                        ? 'sub_variant_id-error'
                        : undefined
                    }
                    className={`${fieldBaseClass} appearance-none pr-10 ${
                      errors.sub_variant_id
                        ? errorFieldClass
                        : normalFieldClass
                    }`}
                  >
                    <option value="">
                      {form.product_id
                        ? 'Select a sub-variant'
                        : 'Select a product first'}
                    </option>

                    {subVariants.map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.sku} — Stock: {sv.stock}
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
              )}

              {errors.sub_variant_id && (
                <p
                  id="sub_variant_id-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-400/90"
                >
                  {errors.sub_variant_id}
                </p>
              )}

              {/* Available Stock Context */}
              {!isPurchase && form.sub_variant_id && (
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                  <span className="mt-0.5 text-amber-400/70 text-sm">ℹ️</span>

                  <p className="text-xs leading-5 text-zinc-500">
                    Available stock:{' '}
                    <span className="font-medium text-zinc-300">
                      {selectedSubVariant?.stock ?? 0}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Quantity
                <span
                  className="ml-1 text-zinc-500"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={handleChange}
                placeholder="0.00"
                required
                inputMode="decimal"
                aria-invalid={Boolean(errors.quantity)}
                aria-describedby={
                  errors.quantity ? 'quantity-error' : undefined
                }
                className={`${fieldBaseClass} ${
                  errors.quantity
                    ? errorFieldClass
                    : normalFieldClass
                }`}
              />

              {errors.quantity && (
                <p
                  id="quantity-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-400/90"
                >
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Notes
                </label>

                <span className="text-xs text-zinc-600">
                  Optional
                </span>
              </div>

              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add a reason, reference, or internal note..."
                rows={3}
                className={`${fieldBaseClass} ${normalFieldClass} min-h-24 resize-y`}
              />
            </div>
          </div>

          {/* ── Form Footer ─────────────────────────────────────────── */}
          <div className="border-t border-zinc-800 bg-zinc-950/25 px-5 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-zinc-600">
                Review the selected variant and quantity before confirming.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-40 ${
                  isPurchase
                    ? 'border border-indigo-500/80 bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500/60'
                    : 'border border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-red-500/40'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    <span>Processing...</span>
                  </>
                ) : isPurchase ? (
                  <>
                    <span className="text-base">+</span>
                    <span>Confirm Addition</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">−</span>
                    <span>Confirm Removal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
