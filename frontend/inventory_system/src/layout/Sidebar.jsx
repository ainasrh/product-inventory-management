import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/products/new', label: 'Create Product', icon: '➕' },
  { to: '/stock', label: 'Stock Management', icon: '📋' },
  { to: '/stock/report', label: 'Stock Report', icon: '📈' },
];

/**
 * open/onClose control the mobile off-canvas drawer.
 * On desktop (lg+) the sidebar is always visible and fixed.
 */
export function Sidebar({ open, onClose, user, onLogout }) {
  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-50 flex flex-col
          transition-transform duration-200 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              IN
            </div>
            <span className="font-semibold text-white tracking-tight">Inventory System</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`
              }
            >
              <span className="text-lg shrink-0">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {(user?.username || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">Signed in</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 justify-center text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-xl px-3 py-2 transition"
          >
            <span className="text-lg">🚪</span>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
