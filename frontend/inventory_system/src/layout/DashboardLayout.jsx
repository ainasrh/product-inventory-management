import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AuthContext } from '../context/AuthContext';

/**
 * Wrap each authenticated page with this, e.g.:
 *   <DashboardLayout title="Products" breadcrumbs={[{label:'Home'},{label:'Products'}]}>
 *     <ProductListPage />
 *   </DashboardLayout>
 *
 * Or, if you prefer, use it once around an <Outlet /> in your router.
 */
export function DashboardLayout({ title, breadcrumbs, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          breadcrumbs={breadcrumbs}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
