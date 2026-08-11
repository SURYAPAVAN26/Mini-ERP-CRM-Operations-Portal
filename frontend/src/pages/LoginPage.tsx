import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const teamAccounts = [
    { name: 'Surya', email: 'kodipathrunisuryapavan2005@gmail.com', pass: 'admin123', role: 'ADMIN', label: 'Surya (Admin)' },
    { name: 'Rajan', email: 'rajanatharun8@gmail.com', pass: 'password123', role: 'ADMIN', label: 'Rajan (Admin)' },
    { name: 'Shashank', email: 'shashank@nexusopera.com', pass: 'warehouse123', role: 'WAREHOUSE', label: 'Shashank (Warehouse)' },
    { name: 'Jyanesh', email: 'jyanesh@nexusopera.com', pass: 'sales123', role: 'SALES', label: 'Jyanesh (Sales)' },
    { name: 'Koushik', email: 'koushik@nexusopera.com', pass: 'accounts123', role: 'ACCOUNTS', label: 'Koushik (Accounts)' },
    { name: 'Ruthwik', email: 'ruthwik@nexusopera.com', pass: 'sales123', role: 'SALES', label: 'Ruthwik (Sales)' },
  ];

  const handleQuickSelect = (acc: typeof teamAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
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
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
      }}>
        <div className="card card-glass" style={{ padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              marginBottom: '14px'
            }}>
              <Shield size={40} color="#6366f1" />
            </div>
            <h1 style={{ fontSize: '1.8rem', background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>
              NEXUS OPERA
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Enterprise Wholesale ERP & CRM Operations Portal
            </p>
          </div>

          {/* Quick Team Sign-In Buttons (Surya, Shashank, Jyanesh, Koushik, Ruthwik, Rajan) */}
          <div style={{ marginBottom: '24px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#818cf8', marginBottom: '10px' }}>
              <UserCheck size={16} />
              <span>Team Fast Login (No OTP Needed)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {teamAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickSelect(acc)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '10px',
                    border: email === acc.email ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: email === acc.email ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.7)',
                    color: '#f8fafc',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                  title={`Click to pre-fill ${acc.label}`}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>Work / Registered Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="Select a team member above or enter email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '42px' }}
                  placeholder="Enter your password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem' }} disabled={loading}>
              {loading ? 'Authenticating...' : (
                <>
                  <span>Sign In as {email ? email.split('@')[0] : 'User'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
              Create Account / Register
            </Link>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Database Verified Team Accounts • Protected Enterprise Portal
          </div>
        </div>
      </div>
    </div>
  );
};
