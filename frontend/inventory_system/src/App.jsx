import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductCreatePage } from './pages/ProductCreatePage';
import { StockManagementPage } from './pages/StockManagementPage';
import { StockReportPage } from './pages/StockReportPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import './App.css';

// ── Protected Route Wrapper ────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);

  if (loading) return <LoadingSpinner />;
  if (!token) return <Navigate to="/login" />;
  return children;
}

// ── Layout with Navigation ────────────────────────────────────────────
function Layout({ children }) {
  const { logout, user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-gray-900">Inventory System</h1>
            <div className="hidden md:flex gap-6 text-sm">
              <a href="/products" className="text-gray-600 hover:text-gray-900 font-medium">Products</a>
              <a href="/stock" className="text-gray-600 hover:text-gray-900 font-medium">Stock Mgmt</a>
              <a href="/stock/report" className="text-gray-600 hover:text-gray-900 font-medium">Reports</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-gray-600">Hi, <strong>{user.username}</strong></span>}
            <button
              onClick={logout}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductCreatePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <Layout>
                <StockManagementPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock/report"
          element={
            <ProtectedRoute>
              <Layout>
                <StockReportPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/products" />} />
        <Route path="*" element={<Navigate to="/products" />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        }}
      />
    </Router>
  );
}

// ── Main App ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
