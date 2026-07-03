import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';

export function Navbar() {
  const { logout, user } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      label: 'Products',
      to: '/products',
    },
    {
      label: 'Stock Mgmt',
      to: '/stock',
    },
    {
      label: 'Reports',
      to: '/stock/report',
    },
  ];

  const isActiveRoute = (path) => {
    if (path === '/stock') {
      return location.pathname === '/stock';
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ── Brand + Desktop Navigation ─────────────────────────── */}
          <div className="flex min-w-0 items-center">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
              aria-label="Inventory System home"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-lg transition-colors group-hover:border-zinc-700 group-hover:bg-zinc-800"
                aria-hidden="true"
              >
                📦
              </span>

              <span className="hidden text-sm font-semibold tracking-tight text-zinc-100 sm:block">
                Inventory System
              </span>
            </Link>

            <div className="ml-8 hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}

                    {isActive && (
                      <span
                        className="absolute inset-x-3 -bottom-[13px] h-px bg-indigo-400/80"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Desktop User Actions ───────────────────────────────── */}
          <div className="hidden items-center gap-3 md:flex">
            {user && (
              <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-sm"
                  aria-hidden="true"
                >
                  👤
                </span>

                <div className="max-w-40 min-w-0">
                  <p className="truncate text-xs text-zinc-500">
                    Signed in as
                  </p>

                  <p className="truncate text-sm font-medium text-zinc-300">
                    {user.username}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            >
              <span className="text-base">🚪</span>
              <span>Logout</span>
            </button>
          </div>

          {/* ── Mobile Menu Toggle ─────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 md:hidden"
            aria-label={
              mobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="text-xl" aria-hidden="true">
              {mobileMenuOpen ? '✕' : '☰'}
            </span>
          </button>
        </div>

        {/* ── Mobile Navigation ────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-zinc-800 py-4 md:hidden"
          >
            {/* User Context */}
            {user && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-base"
                  aria-hidden="true"
                >
                  👤
                </span>

                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">
                    Signed in as
                  </p>

                  <p className="truncate text-sm font-medium text-zinc-300">
                    {user.username}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                      isActive
                        ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                        : 'border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Logout */}
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
              >
                <span className="text-base">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}