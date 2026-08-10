import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, Package, AlertTriangle, Filter } from 'lucide-react';
import { api } from '../services/api';
import { Product, Pagination } from '../types';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          page,
          limit: 10,
          search: search.trim(),
          category: category || undefined,
          low_stock: lowStockOnly ? 'true' : undefined,
        },
      });

      if (res.data.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, category, lowStockOnly]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Products Catalog & Pricing</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Master catalog of items, SKUs, warehouse locations, and minimum threshold alerts</p>
        </div>

        {hasRole(['ADMIN', 'WAREHOUSE']) && (
          <Link to="/products/new" className="btn btn-primary">
            <Plus size={18} />
            <span>Add New Product</span>
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Search product name, SKU, or warehouse location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Filter Category..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            <AlertTriangle size={16} />
            <span>{lowStockOnly ? 'Low Stock Filter Active' : 'Filter Low Stock'}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found matching your search.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Alert Min Qty</th>
                  <th>Warehouse Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{p.sku}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-role" style={{ fontSize: '0.7rem' }}>{p.category}</span></td>
                    <td style={{ fontWeight: 700 }}>₹{Number(p.unit_price).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${p.is_low_stock ? 'badge-low-stock' : 'badge-in-stock'}`}>
                        {p.current_stock} pcs
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.min_stock_alert} pcs</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.location}</td>
                    <td style={{ textAlign: 'right' }}>
                      {hasRole(['ADMIN', 'WAREHOUSE']) && (
                        <Link to={`/products/${p.id}/edit`} className="btn btn-sm btn-secondary" title="Edit Product">
                          <Edit size={16} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchProducts(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProducts(pagination.page + 1)}
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
