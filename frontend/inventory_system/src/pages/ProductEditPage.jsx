import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProduct, updateProduct, addVariant, getSubVariants } from '../services/productService';
import { updateVariant, deleteVariant } from '../services/variantService';
import { getErrorMessage, extractFieldErrors } from '../utils/getErrorMessage';
import { validateProductForm } from '../utils/validators';

// ── Small shared-style primitives (local to this page for now) ────────────
function Field({ label, name, value, onChange, error, required, placeholder, type = 'text' }) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-[#1F2937] text-gray-50 placeholder-gray-500
          border ${error ? 'border-red-500' : 'border-[#4B5563]'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200 text-sm`}
      />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`bg-[#1F2937] rounded-xl border border-[#374151] shadow-lg shadow-black/20 p-6 ${className}`}>
      {title && (
        <div className="mb-5">
          <h2 className="font-semibold text-gray-50 text-base">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function Tag({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1.5 rounded-full">
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:text-blue-200 font-bold leading-none">×</button>
      )}
    </span>
  );
}

export function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ProductName: '', ProductCode: '', HSNCode: '', IsFavourite: false, Active: true,
  });
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [variants, setVariants] = useState([]);
  const [savingVariantId, setSavingVariantId] = useState(null);
  const [newVariant, setNewVariant] = useState({ name: '', options: [], optionInput: '' });
  const [addingVariant, setAddingVariant] = useState(false);

  const [subVariants, setSubVariants] = useState([]);
  const [subVariantsLoading, setSubVariantsLoading] = useState(false);

  const loadProduct = async () => {
    const product = await getProduct(id);
    setForm({
      ProductName: product.ProductName ?? '',
      ProductCode: product.ProductCode ?? '',
      HSNCode: product.HSNCode ?? '',
      IsFavourite: !!product.IsFavourite,
      Active: !!product.Active,
    });
    setExistingImageUrl(product.ProductImage ?? null);
    setVariants(
      (product.variants ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        options: (v.options ?? []).map((o) => o.value),
        optionInput: '',
        dirty: false,
      }))
    );
    setSubVariants(product.sub_variants ?? []);
    return product;
  };

  const refreshSubVariants = async () => {
    setSubVariantsLoading(true);
    try {
      const res = await getSubVariants(id);
      setSubVariants(res.results ?? res);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubVariantsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadProduct();
      } catch (err) {
        if (!cancelled) {
          toast.error(getErrorMessage(err));
          navigate('/products');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const clearNewImage = () => { setImageFile(null); setImagePreview(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const { isValid, errors: ve } = validateProductForm({ ...form, variants: variants.length ? variants : [{}] });
    if (!isValid) { setErrors(ve); return; }

    setSubmitting(true);
    try {
      const pendingVariants = variants.filter((v) => v.dirty || v.optionInput.trim() !== '');

      if (pendingVariants.length > 0) {
        const results = await Promise.allSettled(
          pendingVariants.map((v) => {
            const pending = v.optionInput.trim();
            const finalOptions = pending && !v.options.includes(pending)
              ? [...v.options, pending]
              : v.options;
            return updateVariant(v.id, { name: v.name, options: finalOptions })
              .then((updated) => ({ variantId: v.id, updated }));
          })
        );

        const failed = results.filter((r) => r.status === 'rejected');
        const succeeded = results.filter((r) => r.status === 'fulfilled');

        if (succeeded.length > 0) {
          setVariants((prev) => prev.map((x) => {
            const match = succeeded.find((r) => r.value.variantId === x.id);
            return match
              ? { ...x, name: match.value.updated.name,
                  options: (match.value.updated.options ?? []).map((o) => o.value),
                  optionInput: '', dirty: false }
              : x;
          }));
        }

        if (failed.length > 0) {
          toast.error(`${failed.length} variant(s) failed to save — check them before leaving.`);
        }
        if (succeeded.length > 0) {
          await refreshSubVariants();
        }
        if (failed.length > 0) {
          setSubmitting(false);
          return;
        }
      }

      let payload;
      if (imageFile) {
        payload = new FormData();
        payload.append('ProductName', form.ProductName);
        payload.append('ProductCode', form.ProductCode);
        payload.append('HSNCode', form.HSNCode || '');
        payload.append('IsFavourite', form.IsFavourite);
        payload.append('Active', form.Active);
        payload.append('ProductImage', imageFile);
      } else {
        payload = { ...form };
      }
      await updateProduct(id, payload);
      toast.success('Product updated successfully!');
      navigate('/products');
    } catch (err) {
      setErrors(extractFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const patchVariant = (variantId, patch) =>
    setVariants((p) => p.map((v) => v.id === variantId ? { ...v, ...patch, dirty: true } : v));

  const addOptionToVariant = (variantId) => {
    const v = variants.find((x) => x.id === variantId);
    const raw = v.optionInput.trim();
    if (!raw || v.options.includes(raw)) return;
    patchVariant(variantId, { options: [...v.options, raw], optionInput: '' });
  };

  const removeOptionFromVariant = (variantId, opt) => {
    const v = variants.find((x) => x.id === variantId);
    patchVariant(variantId, { options: v.options.filter((o) => o !== opt) });
  };

  const saveVariant = async (variantId) => {
    const v = variants.find((x) => x.id === variantId);
    const pending = v.optionInput.trim();
    const finalOptions = pending && !v.options.includes(pending) ? [...v.options, pending] : v.options;

    if (!v.name.trim() || finalOptions.length === 0) {
      toast.error('Variant needs a name and at least one option.');
      return;
    }
    setSavingVariantId(variantId);
    try {
      const updated = await updateVariant(variantId, { name: v.name, options: finalOptions });
      toast.success(`Variant "${v.name}" updated`);
      setVariants((p) => p.map((x) =>
        x.id === variantId
          ? { ...x, name: updated.name, options: (updated.options ?? []).map((o) => o.value), optionInput: '', dirty: false }
          : x
      ));
      await refreshSubVariants();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingVariantId(null);
    }
  };

  const removeVariant = async (variantId, name) => {
    if (!window.confirm(`Delete variant "${name}"? This regenerates all sub-variants.`)) return;
    setSavingVariantId(variantId);
    try {
      await deleteVariant(variantId);
      setVariants((p) => p.filter((v) => v.id !== variantId));
      toast.success(`Variant "${name}" deleted`);
      await refreshSubVariants();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingVariantId(null);
    }
  };

  const addNewOption = () => {
    const raw = newVariant.optionInput.trim();
    if (!raw || newVariant.options.includes(raw)) return;
    setNewVariant((p) => ({ ...p, options: [...p.options, raw], optionInput: '' }));
  };
  const removeNewOption = (opt) =>
    setNewVariant((p) => ({ ...p, options: p.options.filter((o) => o !== opt) }));

  const submitNewVariant = async () => {
    if (!newVariant.name.trim() || newVariant.options.length === 0) {
      toast.error('New variant needs a name and at least one option.');
      return;
    }
    setAddingVariant(true);
    try {
      const created = await addVariant(id, { name: newVariant.name, options: newVariant.options });
      setVariants((p) => [...p, {
        id: created.id, name: created.name,
        options: (created.options ?? []).map((o) => o.value),
        optionInput: '', dirty: false,
      }]);
      setNewVariant({ name: '', options: [], optionInput: '' });
      toast.success(`Variant "${created.name}" added`);
      await refreshSubVariants();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingVariant(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm">Loading product…</span>
        </div>
      </div>
    );
  }

  const displayedImage = imagePreview || existingImageUrl;

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <nav className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <span className="hover:text-gray-300 cursor-pointer" onClick={() => navigate('/products')}>Products</span>
            <span>/</span>
            <span className="text-gray-300">Edit</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-50">Edit Product</h1>
          <p className="text-sm text-gray-400 mt-1">Update product details, variants, and view stock levels.</p>
        </div>

        {errors.api && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Product Details ─────────────────────────────────── */}
          <Card title="Product Details" subtitle="Core information shown across the catalog.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <Field label="Product Name" name="ProductName" value={form.ProductName}
                onChange={handleChange} error={errors.ProductName} required />
              <Field label="Product Code" name="ProductCode" value={form.ProductCode}
                onChange={handleChange} error={errors.ProductCode} required />
              <Field label="HSN Code" name="HSNCode" value={form.HSNCode}
                onChange={handleChange} error={errors.HSNCode} placeholder="Optional" />
            </div>

            <div className="flex gap-6 mt-1 mb-5">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                <input type="checkbox" name="Active" checked={form.Active} onChange={handleChange}
                  className="w-4 h-4 rounded accent-blue-500 bg-[#1F2937] border-[#4B5563]" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                <input type="checkbox" name="IsFavourite" checked={form.IsFavourite} onChange={handleChange}
                  className="w-4 h-4 rounded accent-blue-500 bg-[#1F2937] border-[#4B5563]" />
                Mark as Favourite
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Image</label>
              <div className="flex items-start gap-4">
                {displayedImage ? (
                  <img src={displayedImage} alt="Product" className="w-24 h-24 object-cover rounded-xl border border-[#4B5563]" />
                ) : (
                  <div className="w-24 h-24 rounded-xl border border-dashed border-[#4B5563] flex items-center justify-center text-gray-500 text-xs">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center justify-center gap-2 text-xs font-medium bg-[#374151] hover:bg-[#4B5563] text-gray-200 border border-[#4B5563] rounded-lg px-3.5 py-2 cursor-pointer transition-all duration-200 w-fit">
                    Choose File
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imageFile && (
                    <button type="button" onClick={clearNewImage}
                      className="text-xs text-red-400 hover:text-red-300 text-left transition-colors duration-200">
                      Undo change
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ── Save actions ─────────────────────────────────────── */}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed
                text-white font-medium py-2.5 rounded-xl text-sm transition-all duration-200
                shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2">
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {submitting ? 'Saving…' : 'Save Product Details'}
            </button>
            <button type="button" onClick={() => navigate('/products')}
              className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-gray-200 border border-[#4B5563]
                font-medium py-2.5 rounded-xl text-sm transition-all duration-200">
              Cancel
            </button>
          </div>
        </form>

        {/* ── Variants ─────────────────────────────────────────────── */}
        <Card title="Variants" subtitle="Each variant saves independently and regenerates sub-variants." className="mt-6">
          <div className="space-y-3 mb-4">
            {variants.map((v) => (
              <div key={v.id} className="border border-[#374151] rounded-xl p-4 bg-[#111827]/50 hover:border-[#4B5563] transition-all duration-200">
                <div className="flex gap-2 mb-3">
                  <input type="text" value={v.name}
                    onChange={(e) => patchVariant(v.id, { name: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-lg bg-[#1F2937] text-gray-50 border border-[#4B5563]
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200" />
                  <button type="button" onClick={() => saveVariant(v.id)} disabled={savingVariantId === v.id || !v.dirty}
                    className="text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
                      text-white px-4 rounded-lg font-medium transition-all duration-200">
                    {savingVariantId === v.id ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => removeVariant(v.id, v.name)} disabled={savingVariantId === v.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm px-3 rounded-lg transition-all duration-200">
                    Delete
                  </button>
                </div>
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Type option then Enter" value={v.optionInput}
                    onChange={(e) => patchVariant(v.id, { optionInput: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOptionToVariant(v.id); } }}
                    className="flex-1 px-3.5 py-2 rounded-lg bg-[#1F2937] text-gray-50 placeholder-gray-500 border border-[#4B5563]
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200" />
                  <button type="button" onClick={() => addOptionToVariant(v.id)}
                    className="text-sm bg-[#374151] hover:bg-[#4B5563] text-gray-200 px-4 rounded-lg border border-[#4B5563] transition-all duration-200">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {v.options.map((opt) => (
                    <Tag key={opt} onRemove={() => removeOptionFromVariant(v.id, opt)}>{opt}</Tag>
                  ))}
                </div>
                {v.dirty && (
                  <p className="text-xs text-amber-400 mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Unsaved changes — click Save to keep them
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Add new variant */}
          <div className="border border-dashed border-[#4B5563] rounded-xl p-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Add New Variant</p>
            <input type="text" placeholder="Variant name" value={newVariant.name}
              onChange={(e) => setNewVariant((p) => ({ ...p, name: e.target.value }))}
              className="w-full mb-2 px-3.5 py-2 rounded-lg bg-[#1F2937] text-gray-50 placeholder-gray-500 border border-[#4B5563]
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200" />
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Type option then Enter" value={newVariant.optionInput}
                onChange={(e) => setNewVariant((p) => ({ ...p, optionInput: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewOption(); } }}
                className="flex-1 px-3.5 py-2 rounded-lg bg-[#1F2937] text-gray-50 placeholder-gray-500 border border-[#4B5563]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200" />
              <button type="button" onClick={addNewOption}
                className="text-sm bg-[#374151] hover:bg-[#4B5563] text-gray-200 px-4 rounded-lg border border-[#4B5563] transition-all duration-200">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {newVariant.options.map((opt) => (
                <Tag key={opt} onRemove={() => removeNewOption(opt)}>{opt}</Tag>
              ))}
            </div>
            <button type="button" onClick={submitNewVariant} disabled={addingVariant}
              className="text-sm bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
                text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-green-600/20">
              {addingVariant ? 'Adding…' : '+ Add Variant'}
            </button>
          </div>
        </Card>

       {/* ── Sub-variants (read-only) ─────────────────────────────── */}
        <Card title="Sub-Variants" subtitle="Stock is managed via Purchase/Sale in Stock Management, not here." className="mt-6 mb-8">
            {subVariantsLoading && <p className="text-sm text-gray-400">Refreshing…</p>}

            {!subVariantsLoading && subVariants.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No sub-variants yet.</p>
              </div>
            )}

            <div className="overflow-x-auto -mx-2">
              <div className="min-w-full inline-block align-middle px-2">
                {/* 
                  Added max-h-[490px] and overflow-y-auto here. 
                  This caps the view container at exactly 10 items and then enables standard vertical scrolling.
                */}
                <div className="space-y-1.5 max-h-[490px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {subVariants.map((sv) => (
                    <div 
                      key={sv.id}
                      className="flex items-center justify-between border border-[#374151] rounded-xl px-4 py-3 hover:border-[#4B5563] hover:bg-[#111827]/40 transition-all duration-200"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-100 truncate">{sv.sku}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {(sv.options ?? []).map((o) => o.value).join(' / ')}
                        </p>
                      </div>
                      <span className={`shrink-0 ml-3 text-xs font-semibold px-2.5 py-1 rounded-full
                        ${Number(sv.stock) > 0
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                        {sv.stock} in stock
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
      </div>
    </div>
  );
}