import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, FileSpreadsheet, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { SalesChallan, Pagination } from '../types';
import { useAuth } from '../context/AuthContext';

export const ChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchChallans = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/challans', {
        params: {
          page,
          limit: 10,
          search: search.trim(),
          status: status || undefined,
        },
      });

      if (res.data.success) {
        setChallans(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans(1);
  }, [search, status]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Sales Challans Management</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generate delivery challans, review product snapshots, and confirm transactional stock fulfillment</p>
        </div>

        {hasRole(['ADMIN', 'SALES']) && (
          <Link to="/challans/create" className="btn btn-primary">
            <Plus size={18} />
            <span>Generate Sales Challan</span>
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Search challan number or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="DRAFT">DRAFT (Stock Untouched)</option>
              <option value="CONFIRMED">CONFIRMED (Stock Deducted)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading sales challans...</div>
        ) : challans.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No sales challans found.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan Number</th>
                  <th>Customer Business</th>
                  <th>Total Qty</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <Link to={`/challans/${ch.id}`} style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {ch.challan_number}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ch.customer_business_name || ch.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ch.customer_name}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ch.total_quantity} pcs</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{Number(ch.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${ch.status.toLowerCase()}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ch.created_by_name || 'Sales Rep'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(ch.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/challans/${ch.id}`} className="btn btn-sm btn-secondary">
                        <Eye size={16} />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total challans)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchChallans(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchChallans(pagination.page + 1)}
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
