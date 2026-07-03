/**
 * title / breadcrumbs describe the current page.
 * breadcrumbs: [{label, to?}]
 */
export function Topbar({ onMenuClick, title, breadcrumbs = [] }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 flex items-center gap-4 px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition text-xl font-bold leading-none"
      >
        ☰
      </button>

      <div className="min-w-0">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-xs text-gray-400 truncate mb-0.5">
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5">/</span>}
                {b.label}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h1>
      </div>
    </header>
  );
}
