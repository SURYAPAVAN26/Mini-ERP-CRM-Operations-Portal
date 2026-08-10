import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS'>('SALES');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (res.data.success) {
        const { email: registeredEmail, otp_code } = res.data.data;
        navigate(`/verify-otp?email=${encodeURIComponent(registeredEmail)}&otp=${encodeURIComponent(otp_code || '')}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div className="card card-glass" style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              marginBottom: '16px'
            }}>
              <Shield size={40} color="#6366f1" />
            </div>
            <h1 style={{ fontSize: '1.8rem', background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>
              NEXUS OPERA
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Create an Account & Test Portal Operations
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="e.g. Surya Pavan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password * (Min 6 chars)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Select Testing Role *</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="SALES">Sales Executive (CRM & Challans)</option>
                <option value="ADMIN">System Admin (Full Access)</option>
                <option value="WAREHOUSE">Warehouse Manager (Stock & Catalog)</option>
                <option value="ACCOUNTS">Accounts Officer (Financial Reports)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem' }} disabled={loading}>
              {loading ? 'Registering Account...' : (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
