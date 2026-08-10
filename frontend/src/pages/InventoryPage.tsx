import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, AlertTriangle, Plus, History, RefreshCw, Layers } from 'lucide-react';
import { api } from '../services/api';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Manual Stock Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [reason, setReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      if (res.data.success) {
        setProducts(res.data.data.products);
        setStats(res.data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjust = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjustQty(1);
    setMovementType('IN');
    setReason('Manual Warehouse Stock Received');
    setModalError(null);
  };

  const handleStockAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setModalError(null);
    setAdjusting(true);

    try {
      const res = await api.post('/inventory/adjust', {
        product_id: selectedProduct.id,
        quantity: Number(adjustQty),
        movement_type: movementType,
        reason: reason.trim(),
      });

      if (res.data.success) {
        setSelectedProduct(null);
        fetchInventory();
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Inventory Stock Management</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Warehouse stock levels, valuations, and stock adjustments</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/stock-movements" className="btn btn-secondary btn-sm">
            <History size={16} />
            <span>Movement Audit History</span>
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={fetchInventory}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Header */}
      <div className="grid-summary">
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Catalog Items</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0' }}>{stats?.total_items || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Stock Quantity</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0', color: '#38bdf8' }}>{stats?.total_stock_count || 0} pcs</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inventory Valuation</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0', color: '#34d399' }}>₹{Number(stats?.total_stock_value || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock Items</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0', color: '#f87171' }}>{stats?.low_stock_count || 0}</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading inventory table...</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Available</th>
                  <th>Min Alert Qty</th>
                  <th>Status</th>
                  <th>Warehouse Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{p.sku}</div>
                    </td>
                    <td><span className="badge badge-role" style={{ fontSize: '0.7rem' }}>{p.category}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{Number(p.unit_price).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>{p.current_stock} pcs</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.min_stock_alert} pcs</td>
                    <td>
                      <span className={`badge ${p.is_low_stock ? 'badge-low-stock' : 'badge-in-stock'}`}>
                        {p.is_low_stock ? 'LOW STOCK' : 'IN STOCK'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.location}</td>
                    <td style={{ textAlign: 'right' }}>
                      {hasRole(['ADMIN', 'WAREHOUSE']) && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleOpenAdjust(p)}>
                          <Plus size={14} />
                          <span>Adjust Stock</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal Dialog */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Adjust Stock - {selectedProduct.name}</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>

            {modalError && (
              <div className="alert alert-danger">
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleStockAdjustSubmit}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <div>SKU: <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedProduct.sku}</strong></div>
                <div>Current Stock: <strong>{selectedProduct.current_stock} pcs</strong></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Movement Type</label>
                  <select
                    className="form-select"
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as any)}
                  >
                    <option value="IN">IN (Add Stock)</option>
                    <option value="OUT">OUT (Remove Stock)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 1)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason / Reference *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Purchase Order #PO-102 Received or Damaged Stock Audit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={adjusting}>
                  {adjusting ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
