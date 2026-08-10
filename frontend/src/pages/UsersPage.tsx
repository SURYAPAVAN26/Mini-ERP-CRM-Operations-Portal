import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Mail, Lock, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
  is_email_verified: boolean;
  created_at: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS'>('SALES');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/admin/users');
      if (res.data.success) {
        setUsers(res.data.data.users);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await api.post('/auth/admin/users', {
        name,
        email: email.trim(),
        password,
        role,
      });

      if (res.data.success) {
        setFormSuccess(res.data.message || `User created with role '${role}'!`);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('SALES');
        fetchUsers();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess(null);
        }, 2000);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'ADMIN': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'WAREHOUSE': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'ACCOUNTS': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      default: return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            User Account Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            System Admin Provisioning & Role Access Control
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={18} />
          <span>Provision New User</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '16px 20px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '16px 20px', textAlign: 'left' }}>Email Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'left' }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No users found in database.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const badge = getRoleBadgeStyle(u.role);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {u.is_email_verified ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem' }}>
                            <CheckCircle size={15} /> Verified
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.85rem' }}>
                            <Clock size={15} /> Unverified (OTP Sent)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Create User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Provision New Employee Account
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="rahul@nexusopera.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Password * (Min 6 chars)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Confirm Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Select Role Access *</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="SALES">SALES — Sales Executive (CRM & Challans)</option>
                  <option value="WAREHOUSE">WAREHOUSE — Warehouse Manager (Stock & Catalog)</option>
                  <option value="ACCOUNTS">ACCOUNTS — Accounts Officer (Financial Reports)</option>
                  <option value="ADMIN">ADMIN — System Administrator (Full Access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Provisioning Account...' : 'Create Account & Send OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
