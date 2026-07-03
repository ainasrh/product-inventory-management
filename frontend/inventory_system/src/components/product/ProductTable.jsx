/**
 * Product Data Table
 * Displays product list with actions
 */

import { useContext } from 'react';
import { Trash2 } from 'lucide-react';
import { Table } from '../Table';
import { StatusBadge, StockBadge } from './ProductBadges';
import { AuthContext } from '../../context/AuthContext';

export function ProductTable({
  products,
  onView,
  onEdit,
  onToggle,
  onDelete,
}) {
  const { user } = useContext(AuthContext);

  const columns = [
    {
      key: 'ProductImage',
      label: 'Image',
      sortDisabled: true,
      render: (v) => (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-700 bg-slate-800">
          {v ? (
            <img src={v} alt="Product" className="h-full w-full object-cover" />
          ) : (
            <span className="text-slate-600 text-lg">🖼️</span>
          )}
        </div>
      ),
    },
    {
      key: 'ProductName',
      label: 'Name',
      render: (v, row) => (
        <div className="flex min-w-0 max-w-[180px] items-center gap-1.5 sm:max-w-[220px]">
          <span className="truncate font-medium text-slate-100" title={v}>
            {v}
          </span>
          {row.IsFavourite && <span className="text-amber-400">⭐</span>}
        </div>
      ),
    },
    {
      key: 'ProductCode',
      label: 'Code',
      render: (v) => (
        <span className="block max-w-[150px] truncate text-slate-400" title={v}>
          {v}
        </span>
      ),
    },
    {
      key: 'HSNCode',
      label: 'HSN',
      render: (v) =>
        v ? (
          <span
            className="inline-block max-w-[130px] truncate rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300"
            title={v}
          >
            {v}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
    {
      key: 'TotalStock',
      label: 'Stock',
      render: (v) => <StockBadge stock={v ?? 0} />,
    },
    {
      key: 'Active',
      label: 'Status',
      render: (v) => <StatusBadge active={v} />,
    },
    {
      key: 'CreatedDate',
      label: 'Created',
      render: (v) => (
        <span className="whitespace-nowrap text-sm text-slate-400">
          {v ? new Date(v).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
  key: 'actions',
  label: 'Actions',
  sortDisabled: true,
  align: 'center',
  render: (_, row) => (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onView(row.id)}
        aria-label={`View ${row.ProductName}`}
        title="View"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <span className="text-base">👁️</span>
      </button>

      {user?.is_superuser && (
        <>
          <button
            type="button"
            onClick={() => onEdit(row.id)}
            aria-label={`Edit ${row.ProductName}`}
            title="Edit"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="text-base">✏️</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(row)}
            aria-label={`Delete ${row.ProductName}`}
            title="Delete"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-400 transition-colors hover:border-slate-700 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  ),
}
  ];

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl">
      <Table columns={columns} rows={products} sortable getRowKey={(r) => r.id} />
    </div>
  );
}
