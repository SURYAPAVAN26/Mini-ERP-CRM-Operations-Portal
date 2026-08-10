import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, User, Building, MapPin, Printer } from 'lucide-react';
import { api } from '../services/api';
import { SalesChallan } from '../types';
import { useAuth } from '../context/AuthContext';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchChallanDetail = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await api.get(`/challans/${id}`);
      if (res.data.success) {
        setChallan(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sales challan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchChallanDetail();
  }, [id]);

  const handleConfirm = async () => {
    if (!challan) return;
    setActionError(null);
    setConfirming(true);

    try {
      const res = await api.post(`/challans/${challan.id}/confirm`);
      if (res.data.success) {
        fetchChallanDetail();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to confirm sales challan');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (!window.confirm('Are you sure you want to cancel this Sales Challan?')) return;
    setActionError(null);
    setCancelling(true);

    try {
      const res = await api.post(`/challans/${challan.id}/cancel`);
      if (res.data.success) {
        fetchChallanDetail();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to cancel sales challan');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading challan document...</div>;
  if (error || !challan) {
    return (
      <div className="alert alert-danger" style={{ margin: '20px' }}>
        <span>{error || 'Sales challan not found'}</span>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/challans')}>Back to Challans</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/challans')}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{challan.challan_number}</h3>
          <span className={`badge badge-${challan.status.toLowerCase()}`}>
            {challan.status}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {challan.status === 'DRAFT' && hasRole(['ADMIN', 'SALES']) && (
            <>
              <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}>
                <XCircle size={16} />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Challan'}</span>
              </button>

              <button className="btn btn-success btn-sm" onClick={handleConfirm} disabled={confirming}>
                <CheckCircle2 size={16} />
                <span>{confirming ? 'Validating Stock...' : 'Confirm & Deduct Stock'}</span>
              </button>
            </>
          )}

          {challan.status === 'CONFIRMED' && hasRole(['ADMIN', 'SALES']) && (
            <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}>
              <XCircle size={16} />
              <span>{cancelling ? 'Restoring Stock...' : 'Cancel & Restock'}</span>
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <strong style={{ fontWeight: 700 }}>Stock Confirmation Error: </strong>
          <span>{actionError}</span>
        </div>
      )}

      {/* Printable Challan Document Card */}
      <div className="card" style={{ padding: '36px' }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              OPUS OPERATIONS ERP
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Official Wholesale Sales & Dispatch Challan</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{challan.challan_number}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Date: {new Date(challan.created_at).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Created By: {challan.created_by_name || 'Sales Officer'}
            </div>
          </div>
        </div>

        {/* Customer & Delivery Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Customer Details
            </h4>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{challan.customer_business_name}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Attention: {challan.customer_name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Phone: {challan.customer_mobile}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email: {challan.customer_email}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>GSTIN: {challan.customer_gst || 'N/A'}</div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Delivery Destination Address
            </h4>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{challan.customer_address}</div>
          </div>
        </div>

        {/* Snapshot Items Table */}
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Dispatch Items (Historical Snapshot)
        </h4>

        <div className="table-container" style={{ marginBottom: '24px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Description</th>
                <th>SKU</th>
                <th>Snapshot Price</th>
                <th>Quantity</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700 }}>{item.product_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{item.sku}</td>
                  <td>₹{Number(item.unit_price).toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>{item.quantity} pcs</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                    ₹{Number(item.subtotal).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Quantity:</span>
              <strong>{challan.total_quantity} pcs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '1.1rem' }}>
              <span>Grand Total:</span>
              <strong style={{ color: '#34d399' }}>₹{Number(challan.total_amount).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
