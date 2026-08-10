import React, { useEffect, useState } from 'react';
import { History, Search, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { StockMovement, Pagination } from '../types';

export const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [movementType, setMovementType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMovements = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/movements', {
        params: {
          page,
          limit: 15,
          movement_type: movementType || undefined,
        },
      });

      if (res.data.success) {
        setMovements(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements(1);
  }, [movementType]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Stock Movement Audit History</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Immutable transactional audit log of all stock increases (IN) and sales deductions (OUT)</p>
        </div>
      </div>

      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '0 1 200px' }}>
            <select className="form-select" value={movementType} onChange={(e) => setMovementType(e.target.value)}>
              <option value="">All Movements (IN & OUT)</option>
              <option value="IN">Stock IN (+ Restock / Supplier)</option>
              <option value="OUT">Stock OUT (- Sales Challan / Order)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading movement log...</div>
        ) : movements.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No stock movement logs found.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product & SKU</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason / Document Ref</th>
                  <th>Executed By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{m.product_name}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{m.sku}</div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {m.movement_type === 'IN' ? (
                          <span className="badge badge-in-stock" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowDownRight size={14} /> IN
                          </span>
                        ) : (
                          <span className="badge badge-low-stock" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowUpRight size={14} /> OUT
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{m.quantity} pcs</td>
                    <td style={{ fontSize: '0.85rem' }}>{m.reason}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.created_by_name || 'System Auto'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchMovements(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchMovements(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
