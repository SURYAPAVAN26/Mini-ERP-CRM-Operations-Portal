import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const testAccounts = [
  { role: 'ADMIN', label: 'System Admin', email: 'admin@company.com', pass: 'admin123', desc: 'Full access to all portal modules' },
  { role: 'SALES', label: 'Sales Rep', email: 'sales@company.com', pass: 'sales123', desc: 'Manage CRM customers & generate Sales Challans' },
  { role: 'WAREHOUSE', label: 'Warehouse Manager', email: 'warehouse@company.com', pass: 'warehouse123', desc: 'Manage product stock & movement logs' },
  { role: 'ACCOUNTS', label: 'Accounts Officer', email: 'accounts@company.com', pass: 'accounts123', desc: 'View customer details & confirmed challans' },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to authenticate. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (account: typeof testAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.pass);
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
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '30px',
        alignItems: 'center'
      }}>
        {/* Left Welcome Panel */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
              <Shield size={36} color="#6366f1" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                OPUS ERP + CRM
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enterprise Distribution & Operations Portal</p>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
            Streamline customer follow-ups, product cataloging, transactional inventory stock deduction, and sales challans with role-enforced access control.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Test Credentials:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {testAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickSelect(acc)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: email === acc.email ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                    border: email === acc.email ? '1px solid #6366f1' : '1px solid #334155',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{acc.label}</span>
                    <span className="badge badge-role" style={{ fontSize: '0.6rem' }}>{acc.role}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="card card-glass" style={{ padding: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Portal Sign In</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Enter your employee credentials to access your dashboard
          </p>

          {error && (
            <div className="alert alert-danger">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Employee Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '12px' }} disabled={loading}>
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            JWT Authenticated • Role Authorization Enforced
          </div>
        </div>
      </div>
    </div>
  );
};
