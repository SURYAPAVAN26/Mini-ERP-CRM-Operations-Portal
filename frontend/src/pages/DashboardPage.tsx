import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, AlertTriangle, FileSpreadsheet, ArrowUpRight, Plus, RefreshCw, History } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: '10px' }} />
        <p>Fetching operational metrics from server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ margin: '20px' }}>
        <span>{error}</span>
        <button className="btn btn-sm btn-secondary" onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  const { customers, inventory, challans, low_stock_products, recent_movements, recent_challans } = data || {};

  return (
    <div>
      {/* Quick Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Operations Summary</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Real-time inventory stock levels, customer leads, and sales challans</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {hasRole(['ADMIN', 'SALES']) && (
            <Link to="/challans/create" className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Create Challan</span>
            </Link>
          )}
          {hasRole(['ADMIN', 'WAREHOUSE']) && (
            <Link to="/products/new" className="btn btn-secondary btn-sm">
              <Plus size={16} />
              <span>Add Product</span>
            </Link>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboard} title="Refresh Data">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-summary">
        {/* Total Customers */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Customers</span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '10px', color: '#818cf8' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>{customers?.total_customers || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
            <span><strong style={{ color: '#34d399' }}>{customers?.active_customers || 0}</strong> Active</span>
            <span>•</span>
            <span><strong style={{ color: '#fbbf24' }}>{customers?.lead_customers || 0}</strong> Leads</span>
          </div>
        </div>

        {/* Inventory Stock Count */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catalog Items</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '10px', color: '#38bdf8' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>{inventory?.total_products || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Valuation: <strong style={{ color: 'var(--text-main)' }}>₹{Number(inventory?.total_stock_value || 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="card" style={{ borderColor: inventory?.low_stock_count > 0 ? 'rgba(244, 63, 94, 0.4)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock Alert</span>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '8px', borderRadius: '10px', color: '#f87171' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', color: inventory?.low_stock_count > 0 ? '#f87171' : 'inherit' }}>
            {inventory?.low_stock_count || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {inventory?.low_stock_count > 0 ? 'Products below alert threshold' : 'All product stock levels healthy'}
          </div>
        </div>

        {/* Sales Challans */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sales Challans</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px', color: '#34d399' }}>
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>{challans?.total_challans || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
            <span><strong style={{ color: '#fbbf24' }}>{challans?.draft_challans || 0}</strong> Draft</span>
            <span>•</span>
            <span><strong style={{ color: '#34d399' }}>{challans?.confirmed_challans || 0}</strong> Confirmed</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert Items & Recent Sales Challans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Low Stock Items Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#f87171" />
              <h3 style={{ fontSize: '1rem' }}>Low-Stock Products Alert</h3>
            </div>
            <Link to="/inventory" className="btn btn-sm btn-secondary">
              View Inventory
            </Link>
          </div>

          {low_stock_products?.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No low-stock products currently detected.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>SKU / Product</th>
                    <th>Stock</th>
                    <th>Alert Min</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {low_stock_products?.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{p.sku}</div>
                      </td>
                      <td>
                        <span className="badge badge-low-stock">{p.current_stock} pcs</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.min_stock_alert} pcs</td>
                      <td style={{ fontSize: '0.8rem' }}>{p.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sales Challans */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={18} color="#6366f1" />
              <h3 style={{ fontSize: '1rem' }}>Recent Sales Challans</h3>
            </div>
            <Link to="/challans" className="btn btn-sm btn-secondary">
              View All
            </Link>
          </div>

          {recent_challans?.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No sales challans recorded yet.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Challan #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_challans?.map((ch: any) => (
                    <tr key={ch.id}>
                      <td>
                        <Link to={`/challans/${ch.id}`} style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {ch.challan_number}
                        </Link>
                      </td>
                      <td>
                        <div>{ch.customer_business_name || ch.customer_name}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        ₹{Number(ch.total_amount).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge badge-${ch.status.toLowerCase()}`}>
                          {ch.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stock Movements Log */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1rem' }}>Recent Stock Movement Logs</h3>
          </div>
          <Link to="/stock-movements" className="btn btn-sm btn-secondary">
            Full Audit Log
          </Link>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {recent_movements?.map((m: any) => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{m.product_name}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{m.sku}</div>
                  </td>
                  <td>
                    <span className={`badge ${m.movement_type === 'IN' ? 'badge-in-stock' : 'badge-low-stock'}`}>
                      {m.movement_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{m.quantity} pcs</td>
                  <td style={{ fontSize: '0.85rem' }}>{m.reason}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.created_by_name || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
