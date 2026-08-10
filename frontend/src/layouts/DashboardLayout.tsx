import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  FileSpreadsheet,
  History,
  LogOut,
  Shield,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavConfig {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavConfig[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
  {
    name: 'Customers CRM',
    path: '/customers',
    icon: <Users size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
  {
    name: 'Products Catalog',
    path: '/products',
    icon: <Package size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
  {
    name: 'Inventory Levels',
    path: '/inventory',
    icon: <Boxes size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
  {
    name: 'Stock Movements',
    path: '/stock-movements',
    icon: <History size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
  {
    name: 'Sales Challans',
    path: '/challans',
    icon: <FileSpreadsheet size={18} />,
    roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
  },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (location.pathname.startsWith('/customers/new')) return 'Add New Customer';
    if (location.pathname.startsWith('/customers/')) return 'Customer Details';
    if (location.pathname.startsWith('/customers')) return 'Customer CRM Management';
    if (location.pathname.startsWith('/products/new')) return 'Add New Product';
    if (location.pathname.startsWith('/products/')) return 'Product Details';
    if (location.pathname.startsWith('/products')) return 'Products Management';
    if (location.pathname.startsWith('/inventory')) return 'Inventory & Stock Alert System';
    if (location.pathname.startsWith('/stock-movements')) return 'Stock Movement Logs';
    if (location.pathname.startsWith('/challans/create')) return 'Generate Sales Challan';
    if (location.pathname.startsWith('/challans/')) return 'Sales Challan View';
    if (location.pathname.startsWith('/challans')) return 'Sales Challans Management';
    return 'Operations Portal';
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Shield size={26} color="#6366f1" />
            <span>NEXUS OPERA</span>
          </div>
          <button className="btn btn-sm btn-secondary d-md-none" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-nav">
          {navItems.map(
            (item) =>
              hasRole(item.roles) && (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              )
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#334155', padding: '6px', borderRadius: '50%' }}>
                <UserCheck size={16} color="#818cf8" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name}
                </div>
                <span className="badge badge-role" style={{ fontSize: '0.65rem' }}>
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-secondary"
              title="Logout"
              style={{ padding: '6px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-secondary btn-sm d-md-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={18} />
            </button>
            <h2 style={{ fontSize: '1.25rem' }}>{getPageTitle()}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              LoggedIn as <strong style={{ color: 'var(--text-main)' }}>{user?.email}</strong>
            </div>
          </div>
        </header>

        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
