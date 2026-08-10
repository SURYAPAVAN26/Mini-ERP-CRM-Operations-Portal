import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';
import { Customer, Product } from '../types';

interface LineItem {
  product_id: string;
  quantity: number;
}

export const CreateChallanPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultCustId = searchParams.get('customer_id') || '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustId);

  const [items, setItems] = useState<LineItem[]>([{ product_id: '', quantity: 1 }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers?limit=100'),
          api.get('/products?limit=100'),
        ]);

        if (custRes.data.success) setCustomers(custRes.data.data);
        if (prodRes.data.success) {
          setProducts(prodRes.data.data);
          if (prodRes.data.data.length > 0 && items[0].product_id === '') {
            setItems([{ product_id: prodRes.data.data[0].id, quantity: 1 }]);
          }
        }
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([...items, { product_id: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Compute live Totals
  const calculateTotals = () => {
    let totalQty = 0;
    let grandTotal = 0;

    items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      const price = prod ? Number(prod.unit_price) : 0;
      const qty = Number(item.quantity) || 0;
      totalQty += qty;
      grandTotal += price * qty;
    });

    return { totalQty, grandTotal };
  };

  const { totalQty, grandTotal } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer');
      return;
    }

    if (items.some((i) => !i.product_id || i.quantity <= 0)) {
      setError('Please select valid products and positive quantities for all items');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/challans', {
        customer_id: selectedCustomerId,
        items,
      });

      if (res.data.success) {
        navigate(`/challans/${res.data.data.challan.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading form dependencies...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/challans')}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h3 style={{ fontSize: '1.25rem' }}>Create New Sales Challan</h3>
      </div>

      <div className="card">
        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Selection */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Select Customer *</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business_name} ({c.name} - {c.customer_type})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Table */}
          <h4 style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Challan Line Items (Product Snapshot Storage)
          </h4>

          <div className="table-container" style={{ marginBottom: '16px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Product Item</th>
                  <th style={{ width: '15%' }}>Unit Price</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '15%' }}>Subtotal</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const selectedProd = products.find((p) => p.id === item.product_id);
                  const price = selectedProd ? Number(selectedProd.unit_price) : 0;
                  const subtotal = price * (item.quantity || 0);

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-select"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          required
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) — Stock: {p.current_stock} pcs
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{price.toLocaleString()}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          required
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>₹{subtotal.toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem} style={{ marginBottom: '24px' }}>
            <Plus size={16} />
            <span>Add Line Item</span>
          </button>

          {/* Grand Totals Summary */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Items Quantity:</span>
              <strong style={{ marginLeft: '8px', fontSize: '1.1rem' }}>{totalQty} pcs</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Grand Total Amount:</span>
              <strong style={{ marginLeft: '8px', fontSize: '1.3rem', color: '#34d399' }}>₹{grandTotal.toLocaleString()}</strong>
            </div>
          </div>

          <div className="alert alert-success" style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
            ℹ️ Note: Saving this challan creates a <strong>DRAFT</strong> document. Stock level is NOT deducted until confirmed.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/challans')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} />
              <span>{submitting ? 'Creating Challan...' : 'Save Draft Challan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
