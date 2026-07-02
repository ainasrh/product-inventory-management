import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getProducts, getSubVariants } from '../services/productService';
import {  purchaseStock, saleStock } from '../services/stockService';
import { FormInput } from '../components/FormInput';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { getErrorMessage } from '../utils/getErrorMessage';
import { validateStockForm } from '../utils/validators';
import { TRANSACTION_TYPES } from '../constants/apiConstants';

/**
 * POST /api/stock/purchase/  or  /api/stock/sale/
 * Body: { sub_variant_id, quantity, notes }
 */
export function StockManagementPage() {
  const [txnType, setTxnType] = useState(TRANSACTION_TYPES.PURCHASE);

  const [products, setProducts]           = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [subVariants, setSubVariants]     = useState([]);
  const [subVariantsLoading, setSubVariantsLoading] = useState(false);

  const [form, setForm] = useState({
    product_id: '',
    sub_variant_id: '',
    quantity: '',
    notes: '',
  });
  const [errors, setErrors]     = useState({});
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
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const selectedSV = subVariants.find((sv) => sv.id === form.sub_variant_id);
    const available = selectedSV?.stock ?? 0;

    const { isValid, errors: ve } = validateStockForm(form, available);
    if (!isValid) { setErrors(ve); return; }

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

  if (productsLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Stock Management</h1>

      {/* ── Toggle ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTxnType(TRANSACTION_TYPES.PURCHASE)}
          className={`flex-1 py-2.5 rounded-md font-medium text-sm transition-colors ${
            txnType === TRANSACTION_TYPES.PURCHASE
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          + Add Stock
        </button>
        <button
          onClick={() => setTxnType(TRANSACTION_TYPES.SALE)}
          className={`flex-1 py-2.5 rounded-md font-medium text-sm transition-colors ${
            txnType === TRANSACTION_TYPES.SALE
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          − Remove Stock
        </button>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Product dropdown */}
        <div className="mb-4">
          <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            id="product_id"
            name="product_id"
            value={form.product_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.product_id ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
          >
            <option value="">— Select Product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.ProductCode} — {p.ProductName}</option>
            ))}
          </select>
          {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
        </div>

        {/* Sub-variant dropdown */}
        <div className="mb-4">
          <label htmlFor="sub_variant_id" className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Variant <span className="text-red-500">*</span>
          </label>
          {subVariantsLoading ? (
            <div className="text-xs text-gray-500">Loading…</div>
          ) : (
            <>
              <select
                id="sub_variant_id"
                name="sub_variant_id"
                value={form.sub_variant_id}
                onChange={handleChange}
                disabled={!form.product_id}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.sub_variant_id ? 'border-red-500 bg-red-50' : 'border-gray-300'}
                  ${!form.product_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">— Select Sub-Variant —</option>
                {subVariants.map((sv) => (
                  <option key={sv.id} value={sv.id}>
                    {sv.sku} (Stock: {sv.stock})
                  </option>
                ))}
              </select>
              {errors.sub_variant_id && <p className="text-red-500 text-xs mt-1">{errors.sub_variant_id}</p>}
            </>
          )}

          {/* Show available stock for SALE */}
          {txnType === TRANSACTION_TYPES.SALE && form.sub_variant_id && (
            <div className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1.5 rounded-md">
              <strong>Available:</strong> {subVariants.find((sv) => sv.id === form.sub_variant_id)?.stock ?? 0}
            </div>
          )}
        </div>

        {/* Quantity */}
        <FormInput
          label="Quantity"
          name="quantity"
          type="number"
          step="0.01"
          value={form.quantity}
          onChange={handleChange}
          error={errors.quantity}
          placeholder="0.00"
          required
        />

        {/* Notes */}
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Optional notes (reason, reference, etc.)"
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2.5 rounded-md font-medium text-white text-sm transition-colors ${
            txnType === TRANSACTION_TYPES.PURCHASE
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
          }`}
        >
          {submitting ? 'Processing…' : txnType === TRANSACTION_TYPES.PURCHASE ? 'Add Stock' : 'Remove Stock'}
        </button>
      </form>
    </div>
  );
}
