import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Shield, KeyRound, CheckCircle2, RefreshCw, Mail, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>('OTP has been sent to your email.');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0 && !canResend) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown, canResend]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
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
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError(null);
    setMessage(null);
    try {
      const res = await api.post('/auth/resend-otp', { email: email.trim() });
      if (res.data.success) {
        setMessage('OTP has been sent to your email.');
        setCanResend(false);
        setCooldown(60);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
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
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div className="card card-glass" style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              marginBottom: '16px'
            }}>
              <KeyRound size={36} color="#818cf8" />
            </div>
            <h1 style={{ fontSize: '1.7rem', background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px' }}>
              Enter Email OTP
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Check your email inbox and enter the 6-digit verification code
            </p>
          </div>

          {message && (
            <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                className="form-control"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontFamily: 'var(--font-mono)' }}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem' }} disabled={loading}>
              {loading ? 'Verifying OTP...' : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleResend}
              disabled={!canResend}
            >
              <RefreshCw size={14} />
              <span>{canResend ? 'Resend OTP' : `Resend in ${cooldown}s`}</span>
            </button>

            <Link to="/login" style={{ color: 'var(--text-muted)' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
