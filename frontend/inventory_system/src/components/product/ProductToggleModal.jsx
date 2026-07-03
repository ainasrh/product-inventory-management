/**
 * Product Toggle Active/Inactive Modal
 * Confirmation dialog for activating or deactivating a product
 */

import { Modal } from '../Modal';

export function ProductToggleModal({
  product,
  loading,
  onConfirm,
  onClose,
}) {
  if (!product) return null;

  const isActive = product.Active;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isActive ? 'Deactivate Product' : 'Activate Product'}
    >
      <div className="min-w-0">
        <p className="mb-5 break-words text-sm leading-6 text-slate-400">
          {isActive ? (
            <>
              Deactivate{' '}
              <strong className="break-words text-slate-100">
                {product.ProductName}
              </strong>
              ?
              <br />
              The product will be marked as inactive and hidden from active
              listings.
            </>
          ) : (
            <>
              Activate{' '}
              <strong className="break-words text-slate-100">
                {product.ProductName}
              </strong>
              ?
              <br />
              The product will be marked as active and visible in active
              listings.
            </>
          )}
        </p>

        <div className="flex flex-col-reverse gap-2 min-[480px]:flex-row min-[480px]:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 min-[480px]:flex-1"
          >
            {loading ? 'Processing…' : isActive ? 'Deactivate' : 'Activate'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-700 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-[480px]:flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
