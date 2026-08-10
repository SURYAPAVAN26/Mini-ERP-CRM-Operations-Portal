import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Plus, Phone, Mail, MapPin, FileSpreadsheet, Send } from 'lucide-react';
import { api } from '../services/api';
import { Customer } from '../types';
import { useAuth } from '../context/AuthContext';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow up form state
  const [noteInput, setNoteInput] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [newStatus, setNewStatus] = useState<'Lead' | 'Active' | 'Inactive'>('Lead');
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.data.success) {
        setCustomer(res.data.data);
        setNewStatus(res.data.data.status);
        if (res.data.data.follow_up_date) {
          setFollowUpDate(res.data.data.follow_up_date.split('T')[0]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomerDetails();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    setSavingNote(true);
    try {
      const res = await api.post(`/customers/${id}/notes`, {
        notes: noteInput.trim(),
        follow_up_date: followUpDate || null,
        status: newStatus,
      });

      if (res.data.success) {
        setCustomer(res.data.data);
        setNoteInput('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save follow-up note');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading customer profile...</div>;
  if (error || !customer) {
    return (
      <div className="alert alert-danger" style={{ margin: '20px' }}>
        <span>{error || 'Customer record not found'}</span>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/customers')}>Back to Customers</button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <h3 style={{ fontSize: '1.25rem' }}>{customer.name}</h3>
          <span className={`badge ${customer.status === 'Active' ? 'badge-confirmed' : customer.status === 'Lead' ? 'badge-draft' : 'badge-cancelled'}`}>
            {customer.status}
          </span>
        </div>

        {hasRole(['ADMIN', 'SALES']) && (
          <Link to={`/customers/${customer.id}/edit`} className="btn btn-secondary btn-sm">
            <Edit size={16} />
            <span>Edit Profile</span>
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Customer Information Card */}
        <div className="card">
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Customer Profile Details
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>BUSINESS / COMPANY NAME</span>
              <strong style={{ fontSize: '1.05rem' }}>{customer.business_name}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>CUSTOMER TYPE</span>
                <span className="badge badge-role">{customer.customer_type}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>GST NUMBER</span>
                <code style={{ fontSize: '0.85rem' }}>{customer.gst_number || 'N/A'}</code>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>PHONE / MOBILE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Phone size={16} color="var(--primary)" />
                <span>{customer.mobile}</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>EMAIL ADDRESS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Mail size={16} color="var(--primary)" />
                <span>{customer.email}</span>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>BILLING / DELIVERY ADDRESS</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                <MapPin size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{customer.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CRM Follow-Up Notes Section */}
        <div className="card">
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            CRM Follow-Up Notes & Schedule
          </h4>

          {/* Existing Notes Display */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '14px',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            marginBottom: '16px',
            maxHeight: '160px',
            overflowY: 'auto'
          }}>
            {customer.notes || 'No follow-up notes recorded yet.'}
          </div>

          {/* Add Follow Up Note Form */}
          {hasRole(['ADMIN', 'SALES']) ? (
            <form onSubmit={handleAddNote}>
              <div className="form-group">
                <label>Add Follow-Up Note</label>
                <textarea
                  rows={3}
                  placeholder="Enter call notes, requirements, or updates..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Next Follow-Up Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Customer Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                  >
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={savingNote}>
                <Send size={16} />
                <span>{savingNote ? 'Saving Note...' : 'Log Follow-Up Note'}</span>
              </button>
            </form>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Only Sales and Admin roles can add follow-up notes.</p>
          )}
        </div>
      </div>

      {/* Customer Sales Challan History */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="#6366f1" />
            <h4 style={{ fontSize: '1rem' }}>Sales Challans History for {customer.business_name}</h4>
          </div>
          {hasRole(['ADMIN', 'SALES']) && (
            <Link to={`/challans/create?customer_id=${customer.id}`} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>New Challan</span>
            </Link>
          )}
        </div>

        {customer.recent_challans?.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No sales challans generated for this customer yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan Number</th>
                  <th>Date</th>
                  <th>Total Items Qty</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customer.recent_challans?.map((ch) => (
                  <tr key={ch.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ch.challan_number}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(ch.created_at).toLocaleDateString()}</td>
                    <td>{ch.total_quantity} pcs</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(ch.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${ch.status.toLowerCase()}`}>{ch.status}</span>
                    </td>
                    <td>
                      <Link to={`/challans/${ch.id}`} className="btn btn-sm btn-secondary">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
