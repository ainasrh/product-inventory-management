import { Modal } from '../Modal';

/**
 * Delete Confirmation Modal
 * Props:
 *   deleteTarget      — product object being deleted, or null (controls isOpen)
 *   deleting          — boolean, true while delete request is in flight
 *   onConfirm         — () => void, called when user confirms delete
 *   onClose           — () => void, called when modal is dismissed/cancelled
 */
export function ProductDeleteConfirmation({ deleteTarget, deleting, onConfirm, onClose }) {
  return (
    <Modal
      isOpen={!!deleteTarget}
      onClose={onClose}
      title="Delete Product"
    >
      <div className="min-w-0">
        <p className="mb-5 break-words text-sm leading-6 text-slate-400">
          Delete{' '}
          <strong className="break-words text-slate-100">
            {deleteTarget?.ProductName}
          </strong>
          ?
          <br />
          This action is permanent and cannot be undone. All variants and stock data for this product will also be removed.
        </p>

        <div className="flex flex-col-reverse gap-2 min-[480px]:flex-row min-[480px]:gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 min-[480px]:flex-1"
          >
            {deleting ? 'Deleting…' : 'Delete Product'}
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