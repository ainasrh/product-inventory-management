import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProducts, deleteProduct, getProduct } from '../services/productService';
import { Table }         from '../components/Table';
import { Modal }         from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage }  from '../components/ErrorMessage';
import { EmptyState }    from '../components/EmptyState';
import { getErrorMessage } from '../utils/getErrorMessage';

export function ProductListPage() {
  const navigate = useNavigate();

  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount]     = useState(0);

  // Search
  const [search, setSearch]   = useState('');
  const debounceRef           = useRef(null);

  // Detail modal
  const [detailProduct, setDetailProduct]   = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [deleting, setDeleting]             = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────
  async function fetchProducts(params = {}) {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts({ search, ...params });
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

  useEffect(() => { fetchProducts(); }, []);

  // Debounced search
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts({ search: val });
    }, 400);
  };

  // Paginate using the full URL returned by DRF (contains host + path + params)
  const handlePage = async (url) => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      // Use axios directly with full URL — extract relative path
      const rel = url.replace(/^https?:\/\/[^/]+/, '');
      const res = await getProducts({ _fullUrl: rel }); // handled below
      // Actually call the URL directly via api
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

  // ── Detail modal ─────────────────────────────────────────────────────
  const openDetail = async (product) => {
    setDetailProduct(product); // show modal immediately with basic info
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

  // ── Delete ───────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(`"${deleteTarget.ProductName}" deactivated`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────
  const columns = [
    { key: 'ProductCode', label: 'Code' },
    { key: 'ProductName', label: 'Name' },
    { key: 'HSNCode',     label: 'HSN' },
    {
      key: 'TotalStock', label: 'Stock',
      render: (v) => <span className="font-medium">{v ?? 0}</span>,
    },
    {
      key: 'Active', label: 'Status',
      render: (v) => v
        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
        : <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>,
    },
    {
      key: 'IsFavourite', label: '★',
      render: (v) => v ? '★' : '',
    },
    {
      key: 'CreatedDate', label: 'Created',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-3 text-xs">
          <button onClick={() => openDetail(row)}
            className="text-blue-600 hover:underline font-medium">View</button>
          <button onClick={() => navigate(`/products/${row.id}/edit`)}
            className="text-gray-600 hover:underline font-medium">Edit</button>
          <button onClick={() => setDeleteTarget(row)}
            className="text-red-500 hover:underline font-medium">Delete</button>
        </div>
      ),
    },
  ];

  if (loading && data.length === 0) return <LoadingSpinner />;
  if (error) return (
    <div className="max-w-6xl mx-auto px-4 py-8"><ErrorMessage message={error} /></div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500">{count} total</p>
        </div>
        <button onClick={() => navigate('/products/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium">
          + New Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Search by name, code or HSN…"
          value={search} onChange={handleSearch}
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : data.length === 0
        ? <EmptyState message="No products found." actionLabel="Create Product" onAction={() => navigate('/products/new')} />
        : (
          <>
            <Table columns={columns} rows={data} />

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <button onClick={() => handlePage(prevUrl)} disabled={!prevUrl}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Previous
              </button>
              <button onClick={() => handlePage(nextUrl)} disabled={!nextUrl}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </>
        )}

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} title="Product Detail" maxWidth="max-w-2xl">
        {detailLoading ? <LoadingSpinner /> : detailProduct && (
          <div className="space-y-4 text-sm">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Name', detailProduct.ProductName],
                ['Code', detailProduct.ProductCode],
                ['HSN Code', detailProduct.HSNCode || '—'],
                ['Total Stock', detailProduct.TotalStock ?? 0],
                ['Status', detailProduct.Active ? 'Active' : 'Inactive'],
                ['Favourite', detailProduct.IsFavourite ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-500 text-xs">{k}</p>
                  <p className="font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>

            {/* Image */}
            {detailProduct.ProductImage && (
              <img src={detailProduct.ProductImage} alt="product"
                className="w-28 h-28 object-cover rounded-md border" />
            )}

            {/* Variants */}
            {detailProduct.variants?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Variants</h3>
                {detailProduct.variants.map((v) => (
                  <div key={v.id} className="mb-2">
                    <p className="font-medium">{v.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {v.options.map((o) => (
                        <span key={o.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {o.value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-variants */}
            {detailProduct.sub_variants?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Sub-Variants</h3>
                <table className="w-full text-xs border border-gray-200 rounded">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Stock</th>
                      <th className="px-3 py-2 text-left">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailProduct.sub_variants.map((sv) => (
                      <tr key={sv.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">{sv.sku}</td>
                        <td className="px-3 py-2">{sv.stock}</td>
                        <td className="px-3 py-2">{sv.price ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Deactivate Product">
        <p className="text-sm text-gray-600 mb-5">
          Deactivate <strong>{deleteTarget?.ProductName}</strong>?
          The product will be marked inactive (not permanently deleted).
        </p>
        <div className="flex gap-3">
          <button onClick={confirmDelete} disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-md text-sm font-medium">
            {deleting ? 'Deactivating…' : 'Deactivate'}
          </button>
          <button onClick={() => setDeleteTarget(null)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md text-sm font-medium">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
