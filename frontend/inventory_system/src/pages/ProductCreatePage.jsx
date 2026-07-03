import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createProduct } from '../services/productService';
import { FormInput } from '../components/FormInput';
import { ErrorMessage } from '../components/ErrorMessage';
import { getErrorMessage, extractFieldErrors } from '../utils/getErrorMessage';
import { validateProductForm } from '../utils/validators';

/**
 * POST /api/products/
 * Single call — product + variants + sub-variants all created server-side.
 * Body: { ProductName, ProductCode, HSNCode, IsFavourite, Active,
 *         variants: [{ name, options: [string] }] }
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
  const [variants, setVariants] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  // handle image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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

    const fd = new FormData();
    fd.append('ProductName', form.ProductName);
    fd.append('ProductCode', form.ProductCode);
    fd.append('HSNCode', form.HSNCode || '');
    fd.append('IsFavourite', form.IsFavourite);
    fd.append('Active', form.Active);
    fd.append('variants', JSON.stringify(
      variants.map(({ name, options }) => ({ name, options }))
    ));
    if (imageFile) fd.append('ProductImage', imageFile);

    setSubmitting(true);
    try {
      await createProduct(fd);
      toast.success('Product created successfully!');
      navigate('/products');
    } catch (err) {
      setErrors(extractFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8"></div>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 bg-slate-950">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">Home / Products / New</p>
        <h1 className="text-2xl font-semibold text-white">Create Product</h1>
      </div>

      {errors.api && <div className="mb-4"><ErrorMessage message={errors.api} /></div>}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* ── Product Details ──────────────────────────────────────── */}
        <section className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-6">
          <h2 className="font-semibold text-white mb-5">Product Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormInput label="Product Name" name="ProductName" value={form.ProductName}
              onChange={handleChange} error={errors.ProductName} required />
            <FormInput label="Product Code" name="ProductCode" value={form.ProductCode}
              onChange={handleChange} error={errors.ProductCode}
              placeholder="Unique code, e.g. SHIRT-001" required />
            <FormInput label="HSN Code" name="HSNCode" value={form.HSNCode}
              onChange={handleChange} error={errors.HSNCode} placeholder="Optional" hint="Used for tax classification" />

            {/* Image upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-1.5">Product Image</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gray-700 border border-dashed border-gray-600 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">No img</span>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl px-4 py-2.5 transition">
                    📷 {imagePreview ? 'Change image' : 'Upload image'}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-700 mt-4">
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input type="checkbox" name="Active" checked={form.Active} onChange={handleChange}
                className="w-4 h-4 rounded accent-blue-500" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input type="checkbox" name="IsFavourite" checked={form.IsFavourite} onChange={handleChange}
                className="w-4 h-4 rounded accent-blue-500" />
              Mark as Favourite
            </label>
          </div>
        </section>

        {/* ── Variants ─────────────────────────────────────────────── */}
        <section className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-white">Variants</h2>
            <button 
              type="button" 
              onClick={addVariant}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition inline-flex items-center gap-1"
            >
              <span className="text-lg">+</span> Add Variant
            </button>
          </div>

          {errors.variants && (
            <p className="text-red-400 text-xs mb-3">{errors.variants}</p>
          )}

          {variants.length === 0 && (
            <p className="text-sm text-gray-400">No variants yet — product will have no sub-variants.</p>
          )}

          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="border border-gray-700 rounded-xl p-4 bg-gray-900/40">
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Variant name (e.g. Color, Size)"
                    value={v.name} onChange={(e) => updateVariantName(i, e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white placeholder:text-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  <button type="button" onClick={() => removeVariant(i)}
                    className="text-red-400 hover:bg-red-900/20 rounded-lg px-3 text-sm font-medium transition">
                    Remove
                  </button>
                </div>

                {/* Option input */}
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Type option then Enter (e.g. Red)"
                    value={v.optionInput}
                    onChange={(e) => updateOptionInput(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(i); }}}
                    className="flex-1 px-3.5 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-sm text-white placeholder:text-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                  <button 
                    type="button" 
                    onClick={() => addOption(i)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Add
                  </button>
                </div>

                {/* Option tags */}
                <div className="flex flex-wrap gap-1.5">
                  {v.options.map((opt, oi) => (
                    <span key={oi} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-medium">
                      {opt}
                      <button type="button" onClick={() => removeOption(i, oi)}
                        className="hover:text-white ml-0.5 font-bold">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {v.options.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1.5">Add at least 1 option</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Sub-Variant Preview ───────────────────────────────────── */}
        {subVariantPreview.length > 0 && (
          <section className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3 text-sm">
              Sub-Variant Preview ({subVariantPreview.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {subVariantPreview.map((s, i) => (
                <span key={i} className="bg-gray-800 border border-gray-700 text-gray-400 text-xs px-2.5 py-1 rounded-lg font-mono">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            type="submit" 
            disabled={submitting}
            className="flex-1 sm:flex-none sm:px-8 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition inline-flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {submitting ? 'Creating…' : 'Create Product'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/products')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    
  </main>
    
  );
}
