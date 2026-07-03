/**
 * Custom Hook: useProductList
 * Manages all state, effects, and business logic for ProductListPage
 */

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService';
import { getErrorMessage } from '../utils/getErrorMessage';
import { extractRelativeUrl } from '../utils/productHelpers';

export function useProductList() {
  // ── State Management ───────────────────────────────────────────────
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

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── API Handlers ───────────────────────────────────────────────────

  /**
   * Fetch products from API
   */
  async function fetchProducts(params = {}) {
    setLoading(true);
    setError(null);

    try {
      const res = await getProducts({
        search,
        ...params,
      });

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

  /**
   * Handle pagination navigation
   */
  async function handlePage(url) {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const rel = extractRelativeUrl(url);
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
  }

  /**
   * Open product detail modal
   */
  async function openDetail(product) {
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
  }

  /**
   * Toggle product active/inactive status
   */
  async function confirmToggle() {
    if (!toggleTarget) return;

    setToggling(true);

    try {
      const newActiveStatus = !toggleTarget.Active;

      await updateProduct(toggleTarget.id, {
        Active: newActiveStatus,
      });

      toast.success(
        `Product ${newActiveStatus ? 'activated' : 'deactivated'} successfully`
      );

      setToggleTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(false);
    }
  }

  /**
   * Delete product
   */
  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteProduct(deleteTarget.id);
      toast.success(`"${deleteTarget.ProductName}" deleted successfully`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  /**
   * Handle search with debounce
   */
  function handleSearch(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchProducts({ search: val });
    }, 400);
  }

  // ── Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── Return Public API ──────────────────────────────────────────────

  return {
    // Data
    data,
    loading,
    error,
    count,
    nextUrl,
    prevUrl,

    // Search
    search,
    handleSearch,

    // Detail Modal
    detailProduct,
    detailLoading,
    setDetailProduct,
    openDetail,

    // Toggle Modal
    toggleTarget,
    toggling,
    setToggleTarget,
    confirmToggle,

    // Delete Modal
    deleteTarget,
    deleting,
    setDeleteTarget,
    confirmDelete,

    // Actions
    fetchProducts,
    handlePage,
  };
}
