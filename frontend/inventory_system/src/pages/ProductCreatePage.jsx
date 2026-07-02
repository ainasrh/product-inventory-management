import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createProduct } from '../services/productService';
import { FormInput }     from '../components/FormInput';
import { ErrorMessage }  from '../components/ErrorMessage';
import { getErrorMessage, extractFieldErrors } from '../utils/getErrorMessage';
import { validateProductForm } from '../utils/validators';

/**
 * POST /api/products/
 * Single call — product + variants + sub-variants all created server-side.
 * Body: { ProductName, ProductCode, HSNCode, IsFavourite, Active,
 *         variants: [{ name, options: [string] }] }
 * NOTE: ProductImage is uploaded separately via PATCH after creation.
 */
export function ProductCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ProductName: '',
    ProductCode: '',
    HSNCode: '',
    IsFavourite: false,
    Active: true,
  });
  const [variants, setVariants]   = useState([]);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Field helpers ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  // ── Variant helpers ────────────────────────────────────────────────
  const addVariant = () =>
    setVariants((p) => [...p, { name: '', options: [], optionInput: '' }]);

  const removeVariant = (i) =>
    setVariants((p) => p.filter((_, idx) => idx !== i));

  const updateVariantName = (i, name) =>
    setVariants((p) => p.map((v, idx) => idx === i ? { ...v, name } : v));

  const updateOptionInput = (i, val) =>
    setVariants((p) => p.map((v, idx) => idx === i ? { ...v, optionInput: val } : v));

  const addOption = (i) => {
    const raw = variants[i].optionInput.trim();
    if (!raw) return;
    setVariants((p) =>
      p.map((v, idx) =>
        idx === i && !v.options.includes(raw)
          ? { ...v, options: [...v.options, raw], optionInput: '' }
          : v
      )
    );
  };

  const removeOption = (vi, oi) =>
    setVariants((p) =>
      p.map((v, idx) =>
        idx === vi ? { ...v, options: v.options.filter((_, i) => i !== oi) } : v
      )
    );

  /**
   * Cartesian product for preview.
   * e.g. Color[Red,Blue] × Size[S,M] → [Red-S, Red-M, Blue-S, Blue-M]
   */
  const computeSubVariantPreview = () => {
    const filled = variants.filter((v) => v.options.length > 0);
    if (filled.length === 0) return [];

    let result = filled[0].options.map((o) => [o]);
    for (let i = 1; i < filled.length; i++) {
      const next = [];
      for (const combo of result) {
        for (const opt of filled[i].options) {
          next.push([...combo, opt]);
        }
      }
      result = next;
    }
    // SKU pattern matches backend: ProductCode-opt1-opt2
    return result.map((combo) =>
      [form.ProductCode || 'CODE', ...combo].join('-')
    );
  };

  const subVariantPreview = computeSubVariantPreview();

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const { isValid, errors: ve } = validateProductForm({ ...form, variants });
    if (!isValid) { setErrors(ve); return; }

    const payload = {
      ...form,
      variants: variants.map(({ name, options }) => ({ name, options })),
    };

    setSubmitting(true);
    try {
      await createProduct(payload);
      toast.success('Product created successfully!');
      navigate('/products');
    } catch (err) {
      const msg = getErrorMessage(err);
      const fieldErrs = extractFieldErrors(err);
      setErrors(fieldErrs);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Product</h1>

      {errors.api && <div className="mb-4"><ErrorMessage message={errors.api} /></div>}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Product Details ──────────────────────────────────────── */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Product Details</h2>

          <FormInput label="Product Name" name="ProductName" value={form.ProductName}
            onChange={handleChange} error={errors.ProductName} required />
          <FormInput label="Product Code" name="ProductCode" value={form.ProductCode}
            onChange={handleChange} error={errors.ProductCode}
            placeholder="Unique code, e.g. SHIRT-001" required />
          <FormInput label="HSN Code" name="HSNCode" value={form.HSNCode}
            onChange={handleChange} error={errors.HSNCode} placeholder="Optional" />

          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="Active" checked={form.Active} onChange={handleChange}
                className="w-4 h-4 rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="IsFavourite" checked={form.IsFavourite} onChange={handleChange}
                className="w-4 h-4 rounded" />
              Mark as Favourite
            </label>
          </div>
        </section>

        {/* ── Variants ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Variants</h2>
            <button type="button" onClick={addVariant}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium">
              + Add Variant
            </button>
          </div>

          {errors.variants && (
            <p className="text-red-500 text-xs mb-3">{errors.variants}</p>
          )}

          {variants.length === 0 && (
            <p className="text-sm text-gray-400">No variants yet — product will have no sub-variants.</p>
          )}

          {variants.map((v, i) => (
            <div key={i} className="border border-gray-200 rounded-md p-4 mb-3 bg-gray-50">
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="Variant name (e.g. Color, Size)"
                  value={v.name} onChange={(e) => updateVariantName(i, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => removeVariant(i)}
                  className="text-red-500 hover:text-red-700 text-sm px-3">Remove</button>
              </div>

              {/* Option input */}
              <div className="flex gap-2 mb-2">
                <input type="text" placeholder="Type option then Enter (e.g. Red)"
                  value={v.optionInput}
                  onChange={(e) => updateOptionInput(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(i); }}}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => addOption(i)}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-md">Add</button>
              </div>

              {/* Option tags */}
              <div className="flex flex-wrap gap-1.5">
                {v.options.map((opt, oi) => (
                  <span key={oi} className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    {opt}
                    <button type="button" onClick={() => removeOption(i, oi)}
                      className="hover:text-blue-900 font-bold">×</button>
                  </span>
                ))}
              </div>
              {v.options.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Add at least 1 option</p>
              )}
            </div>
          ))}
        </section>

        {/* ── Sub-Variant Preview ───────────────────────────────────── */}
        {subVariantPreview.length > 0 && (
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">
              Sub-Variant Preview ({subVariantPreview.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {subVariantPreview.map((s, i) => (
                <span key={i} className="bg-white border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-md transition-colors text-sm">
            {submitting ? 'Creating…' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/products')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-md text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
