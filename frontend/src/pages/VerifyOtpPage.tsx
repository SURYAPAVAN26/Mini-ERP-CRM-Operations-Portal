import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, KeyRound, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const demoOtpParam = searchParams.get('otp') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(demoOtpParam);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (demoOtpParam) {
      setOtp(demoOtpParam);
    }
  }, [demoOtpParam]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP verification code');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });

      if (res.data.success) {
        const { token, user } = res.data.data;
        localStorage.setItem('erp_token', token);
        localStorage.setItem('erp_user', JSON.stringify(user));
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    try {
      const res = await api.post('/auth/resend-otp', { email });
      if (res.data.success) {
        setMessage('A new 6-digit OTP code has been generated!');
        if (res.data.data?.otp_code) {
          setOtp(res.data.data.otp_code);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
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
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(16, 185, 129, 0.2)',
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              marginBottom: '16px'
            }}>
              <KeyRound size={40} color="#34d399" />
            </div>
            <h1 style={{ fontSize: '1.7rem', background: 'linear-gradient(135deg, #34d399 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>
              Email Verification OTP
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Enter the 6-digit code generated for <strong>{email || 'your email'}</strong>
            </p>
          </div>

          {demoOtpParam && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                Generated OTP Verification Code:
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '6px', fontFamily: 'var(--font-mono)', color: '#ffffff', margin: '4px 0' }}>
                {demoOtpParam}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Click 'Verify Email Code' below to log in instantly.
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>6-Digit OTP Code *</label>
              <input
                type="text"
                maxLength={6}
                className="form-control"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontFamily: 'var(--font-mono)' }}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem' }} disabled={loading}>
              {loading ? 'Verifying Code...' : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Verify Email Code & Continue</span>
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleResend}>
              <RefreshCw size={14} />
              <span>Resend OTP Code</span>
            </button>
            <Link to="/login" style={{ color: 'var(--text-muted)' }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
