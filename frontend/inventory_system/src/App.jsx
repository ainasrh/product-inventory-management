import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductCreatePage } from './pages/ProductCreatePage';
import { StockManagementPage } from './pages/StockManagementPage';
import { StockReportPage } from './pages/StockReportPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ProductEditPage } from './pages/ProductEditPage';
import { Navbar } from './components/Navbar';
import './App.css';

// ── Single Wrapper for Auth & Layout ──────────────────────────────────
function ProtectedLayout() {
  const { token, loading } = useContext(AuthContext);

  // 1. Check authentication first
  if (loading) return <LoadingSpinner />;
  if (!token) return <Navigate to="/login" />;

  // 2. If authenticated, render the layout
  // <Outlet /> acts as a placeholder where the child routes will be rendered
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet /> 
      </main>
    </div>
  );
}


// ── Admin-Only Wrapper (nested inside ProtectedLayout's auth check) ──
function AdminProtectedLayout() {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) return <LoadingSpinner />;
  if (!token) return <Navigate to="/login" />;

  if (!user?.is_superuser) {
    return <AccessDenied />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet /> 
      </main>
    </div>
  );
}
// ── Access Denied Message ─────────────────────────────────────────────
import { Link } from 'react-router-dom';

// ── Access Denied Message ─────────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
        <svg
          className="w-12 h-12 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600 mb-6">
          Only admin accounts can access this page. Please contact your
          administrator if you believe this is a mistake.
        </p>
        <Link
          to="/products"
          className="inline-block px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
        >
          Back to Products
        </Link>
      </div>
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

        {/* 
          Protected Routes Group 
          Everything inside this <Route> goes through ProtectedLayout
        */}
        <Route element={<ProtectedLayout />}>
          <Route path="/products" element={<ProductListPage />} />
          
          
        </Route>
          
          <Route element={<AdminProtectedLayout />}>
          <Route path="/products/new" element={<ProductCreatePage />} />
          <Route path="/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/stock" element={<StockManagementPage />} />
          <Route path="/stock/report" element={<StockReportPage />} />
            
          </Route>
       


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