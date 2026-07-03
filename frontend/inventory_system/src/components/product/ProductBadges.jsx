/**
 * Product Badge Components
 * Reusable presentational components for status indicators
 */

import { getToneClasses, getStockTone } from '../../utils/productHelpers';

/**
 * Colored dot indicator
 */
export function Dot({ tone }) {
  const tones = getToneClasses();

  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tones[tone]}`}
      aria-hidden="true"
    />
  );
}

/**
 * Status badge (Active/Inactive)
 */
export function StatusBadge({ active }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300">
      <Dot tone={active ? 'success' : 'neutral'} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/**
 * Stock level badge with color coding
 */
export function StockBadge({ stock }) {
  const tone = getStockTone(stock);

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-1 text-xs font-medium text-slate-300">
      <Dot tone={tone} />
      <span className="tabular-nums">{stock}</span>
      <span>in stock</span>
    </span>
  );
}
