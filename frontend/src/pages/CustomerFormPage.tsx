import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../services/api';

export const CustomerFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [customerType, setCustomerType] = useState<'Retail' | 'Wholesale' | 'Distributor'>('Wholesale');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'Lead' | 'Active' | 'Inactive'>('Lead');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchCustomer = async () => {
        try {
          const res = await api.get(`/customers/${id}`);
          if (res.data.success) {
            const c = res.data.data;
            setName(c.name);
            setMobile(c.mobile);
            setEmail(c.email);
            setBusinessName(c.business_name);
            setGstNumber(c.gst_number || '');
            setCustomerType(c.customer_type);
            setAddress(c.address);
            setStatus(c.status);
            if (c.follow_up_date) setFollowUpDate(c.follow_up_date.split('T')[0]);
            setNotes(c.notes || '');
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch customer');
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      business_name: businessName.trim(),
      gst_number: gstNumber.trim() || null,
      customer_type: customerType,
      address: address.trim(),
      status,
      follow_up_date: followUpDate || null,
      notes: notes.trim() || null,
    };

    try {
      if (isEditMode) {
        await api.put(`/customers/${id}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      navigate('/customers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading form...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/customers')}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h3 style={{ fontSize: '1.25rem' }}>{isEditMode ? 'Edit Customer Profile' : 'Add New Customer'}</h3>
      </div>

      <div className="card">
        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Contact Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Business / Company Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Apex Distributors Pvt Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. rahul@apex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>GST Number (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 27AAACA12341Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Customer Type *</label>
              <select
                className="form-select"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as any)}
              >
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
                <option value="Retail">Retail</option>
              </select>
            </div>

            <div className="form-group">
              <label>CRM Status *</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Billing & Delivery Address *</label>
            <textarea
              rows={3}
              placeholder="Enter full street, city, state and pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Initial Follow-Up Date</label>
              <input
                type="date"
                className="form-control"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Internal Notes</label>
            <textarea
              rows={2}
              placeholder="Add key preferences, payment terms, or client background..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} />
              <span>{submitting ? 'Saving Customer...' : isEditMode ? 'Update Customer' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
