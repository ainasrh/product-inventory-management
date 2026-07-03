import { useState } from 'react';

/**
 * Same API as before: columns=[{key,label,render}], rows=[].
 * New optional props:
 *   sortable    — if true, clicking a column header sorts client-side (skipped for columns with `render` + no explicit `sortKey`, unless sortKey given)
 *   getRowKey   — (row) => key, defaults to row.id
 *
 * Column config also supports:
 *   align — 'left' | 'center' | 'right' (defaults to 'left')
 */
export function Table({ columns, rows, sortable = false, getRowKey = (r) => r.id }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  const handleSort = (col) => {
    if (!sortable || col.sortDisabled) return;
    const key = col.sortKey || col.key;
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  let sortedRows = rows;
  if (sortable && sort.key) {
    sortedRows = [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const alignClass = (align) =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className=" rounded-xl overflow-hidden bg-surface shadow-card">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-card sticky top-0 z-10">
            <tr>
              {columns.map((col) => {
                const key = col.sortKey || col.key;
                const isSorted = sortable && sort.key === key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => handleSort(col)}
                    className={`px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide border-b border-border whitespace-nowrap ${alignClass(col.align)} ${
                      sortable && !col.sortDisabled ? 'cursor-pointer select-none hover:text-text' : ''
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                      {col.label}
                      {sortable && !col.sortDisabled && (
                        isSorted ? (
                          sort.dir === 'asc' ? <span className="text-xs">↑</span> : <span className="text-xs">↓</span>
                        ) : (
                          <span className="text-xs opacity-40">⇅</span>
                        )
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={getRowKey(row) ?? i}
                className={`border-b border-border last:border-0 transition-colors duration-150 hover:bg-card/60 ${
                  i % 2 === 1 ? 'bg-white/[0.02]' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-text align-middle whitespace-nowrap ${alignClass(col.align)}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}