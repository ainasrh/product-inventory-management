/**
 * Product List Page (Refactored)
 * Clean architecture: Separation of concerns with custom hooks and child components
 * 
 * Responsibilities:
 * - Orchestrate UI components
 * - Handle navigation
 * - Delegate state management to useProductList hook
 * - Delegate data transformations to productHelpers
 */

import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { ProductDeleteConfirmation } from '../components/modals/ProductDeleteConfirmation';

// Custom Hook
import { useProductList } from '../hooks/useProductList';

// Child Components
import { ProductHeader } from '../components/product/ProductHeader';
import { ProductStats } from '../components/product/ProductStats';
import { ProductSearch } from '../components/product/ProductSearch';
import { ProductTable } from '../components/product/ProductTable';
import { ProductPagination } from '../components/product/ProductPagination';
import { ProductDetailModal } from '../components/product/ProductDetailModal';
import { ProductToggleModal } from '../components/product/ProductToggleModal';

// Utility Functions
import { calculateProductStats } from '../utils/productHelpers';

export function ProductListPage() {
  const navigate = useNavigate();

  // Custom hook manages all state and business logic
  const {
    data,
    loading,
    error,
    count,
    nextUrl,
    prevUrl,
    search,
    handleSearch,
    detailProduct,
    detailLoading,
    setDetailProduct,
    toggleTarget,
    toggling,
    setToggleTarget,
    confirmToggle,
    deleteTarget,
    deleting,
    setDeleteTarget,
    confirmDelete,
    handlePage,
  } = useProductList();

  // Calculate statistics from current data
  const stats = calculateProductStats(data, count);

  // ── Navigation Handlers ────────────────────────────────────────────

  const handleCreateNew = () => navigate('/products/new');
  const handleView = (id) => navigate(`/products/${id}`);
  const handleEdit = (id) => navigate(`/products/${id}/edit`);

  // ── Render: Error State ───────────────────────────────────────────

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] overflow-x-hidden bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-8 xl:px-8">
          <ErrorMessage message={error} />
        </div>
      </main>
    );
  }

  // ── Render: Main Content ───────────────────────────────────────────

  return (
    <main className="min-h-[calc(100vh-64px)] overflow-x-hidden bg-slate-950">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-3 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-8 xl:px-8">
        
        <ProductHeader onCreateNew={handleCreateNew} />

        {/* Statistics cards */}
        <ProductStats stats={stats} />

        {/* Search input */}
        <ProductSearch value={search} onChange={handleSearch} />

        {/* Product table or empty/loading states */}
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
                onAction={handleCreateNew}
              />
            </div>
          ) : (
            <>
              <ProductTable
                products={data}
                onView={handleView}
                onEdit={handleEdit}
                onToggle={setToggleTarget}
                onDelete={setDeleteTarget}
              />

              <ProductPagination
                totalCount={count}
                nextUrl={nextUrl}
                prevUrl={prevUrl}
                onNext={() => handlePage(nextUrl)}
                onPrevious={() => handlePage(prevUrl)}
              />
            </>
          )}
        </section>

        {/* Modals */}
        <ProductDetailModal
          product={detailProduct}
          loading={detailLoading}
          onClose={() => setDetailProduct(null)}
        />

        <ProductToggleModal
          product={toggleTarget}
          loading={toggling}
          onConfirm={confirmToggle}
          onClose={() => setToggleTarget(null)}
        />

        <ProductDeleteConfirmation
          deleteTarget={deleteTarget}
          deleting={deleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </main>
  );
}