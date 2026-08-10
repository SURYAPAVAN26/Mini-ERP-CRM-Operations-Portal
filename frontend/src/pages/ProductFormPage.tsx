import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../services/api';

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [unitPrice, setUnitPrice] = useState<number | ''>(0);
  const [currentStock, setCurrentStock] = useState<number | ''>(0);
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const res = await api.get(`/products/${id}`);
          if (res.data.success) {
            const p = res.data.data;
            setName(p.name);
            setSku(p.sku);
            setCategory(p.category);
            setUnitPrice(Number(p.unit_price));
            setCurrentStock(p.current_stock);
            setMinStockAlert(p.min_stock_alert);
            setLocation(p.location);
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to load product details');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (unitPrice === '' || unitPrice < 0) {
      setError('Unit price must be a non-negative number');
      return;
    }
    if (currentStock === '' || currentStock < 0) {
      setError('Current stock cannot be negative');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: category.trim(),
      unit_price: Number(unitPrice),
      current_stock: Number(currentStock),
      min_stock_alert: Number(minStockAlert),
      location: location.trim(),
    };

    try {
      if (isEditMode) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading product form...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/products')}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h3 style={{ fontSize: '1.25rem' }}>{isEditMode ? 'Edit Product Item' : 'Add New Product Item'}</h3>
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
              <label>Product Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Samsung 27 Gaming Monitor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>SKU / Product Code * (Unique)</label>
              <input
                type="text"
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)' }}
                placeholder="e.g. MON-SAM-27"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Electronics, Peripherals, Laptops..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Initial Stock Quantity *</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                required
              />
            </div>

            <div className="form-group">
              <label>Min Stock Alert Qty *</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                required
              />
            </div>

            <div className="form-group">
              <label>Warehouse Location *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Warehouse A - Bay 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} />
              <span>{submitting ? 'Saving Product...' : isEditMode ? 'Update Product' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
