import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Filter, UserCheck, Calendar, Phone, Mail } from 'lucide-react';
import { api } from '../services/api';
import { Customer, Pagination } from '../types';
import { useAuth } from '../context/AuthContext';

export const CustomersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: {
          page,
          limit: 10,
          search: search.trim(),
          status: status || undefined,
          customer_type: customerType || undefined,
        },
      });

      if (res.data.success) {
        setCustomers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, status, customerType]);

  return (
    <div>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Customer CRM Directory</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manage leads, active clients, contact information, and follow-up schedules</p>
        </div>

        {hasRole(['ADMIN', 'SALES']) && (
          <Link to="/customers/new" className="btn btn-primary">
            <Plus size={18} />
            <span>Add New Customer</span>
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Search by customer name, business, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ flex: '0 1 160px' }}>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Customer Type Filter */}
          <div style={{ flex: '0 1 160px' }}>
            <select className="form-select" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
              <option value="">All Types</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customers...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customer records found matching your filters.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer / Business</th>
                  <th>Contact Information</th>
                  <th>Type</th>
                  <th>GST Number</th>
                  <th>Status</th>
                  <th>Follow-up Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.business_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="var(--text-muted)" />
                        <span>{c.mobile}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>{c.customer_type}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{c.gst_number || 'N/A'}</td>
                    <td>
                      <span
                        className={`badge ${
                          c.status === 'Active'
                            ? 'badge-confirmed'
                            : c.status === 'Lead'
                            ? 'badge-draft'
                            : 'badge-cancelled'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {c.follow_up_date ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                          <Calendar size={14} />
                          <span>{new Date(c.follow_up_date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No follow-up</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Link to={`/customers/${c.id}`} className="btn btn-sm btn-secondary" title="View Details">
                          <Eye size={16} />
                        </Link>
                        {hasRole(['ADMIN', 'SALES']) && (
                          <Link to={`/customers/${c.id}/edit`} className="btn btn-sm btn-secondary" title="Edit Customer">
                            <Edit size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total customers)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchCustomers(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCustomers(pagination.page + 1)}
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
