/**
 * Product Detail Modal
 * Displays full product information including variants and sub-variants
 */

import { Modal } from '../Modal';
import { LoadingSpinner } from '../LoadingSpinner';
import { StatusBadge } from './ProductBadges';
import { formatProductDetailFields } from '../../utils/productHelpers';

export function ProductDetailModal({ product, loading, onClose }) {
  return (
    <Modal
      isOpen={!!product}
      onClose={onClose}
      title="Product Detail"
      maxWidth="max-w-2xl"
    >
      {loading ? (
        <div className="py-8">
          <LoadingSpinner />
        </div>
      ) : (
        product && <ProductDetailContent product={product} />
      )}
    </Modal>
  );
}

function ProductDetailContent({ product }) {
  const detailFields = formatProductDetailFields(product);

  return (
    <div className="min-w-0 space-y-5 text-sm">
      {/* Image + Basic Info */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
          {product.ProductImage ? (
            <img
              src={product.ProductImage}
              alt="Product"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-slate-600 text-xl">🖼️</span>
          )}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          {detailFields.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className="mb-0.5 text-xs text-slate-500">{key}</p>
              <p className="break-words font-medium text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-wrap gap-2">
        <StatusBadge active={product.Active} />
        {product.IsFavourite && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300">
            <span className="text-amber-400">⭐</span>
            Favourite
          </span>
        )}
      </div>

      {/* Variants */}
      {product.variants?.length > 0 && (
        <VariantsSection variants={product.variants} />
      )}

      {/* Sub-Variants */}
      {product.sub_variants?.length > 0 && (
        <SubVariantsSection subVariants={product.sub_variants} />
      )}
    </div>
  );
}

function VariantsSection({ variants }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 font-semibold text-slate-100">Variants</h3>
      <div className="space-y-3">
        {variants.map((v) => (
          <div key={v.id} className="min-w-0">
            <p className="mb-1.5 break-words text-xs font-medium text-slate-400">
              {v.name}
            </p>
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {v.options.map((o) => (
                <span
                  key={o.id}
                  className="max-w-full break-words rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300"
                >
                  {o.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubVariantsSection({ subVariants }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 font-semibold text-slate-100">Sub-Variants</h3>
      <div className="w-full max-w-full overflow-hidden rounded-lg border border-slate-800">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[420px] text-xs">
            <thead className="bg-slate-900">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500">
                  SKU
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {subVariants.map((sv) => (
                <tr key={sv.id} className="border-t border-slate-800">
                  <td className="max-w-[180px] px-3 py-2 text-slate-100">
                    <span className="block truncate" title={sv.sku}>
                      {sv.sku}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-100">
                    {sv.stock}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-100">
                    {sv.price ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
