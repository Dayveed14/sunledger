import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { finishAuth } from '../lib/postAuth.js';

export default function Verify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const email = location.state?.email;
  const role = location.state?.role;
  const next = location.state?.next;

  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(location.state?.resendIn ?? 60);
  const [notice, setNotice] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) return <Navigate to="/signup" replace />;

  const verify = async (value) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await api.verifyOtp({ email, code: value, ...(role ? { role } : {}) });
      setUser(user);
      await finishAuth(user, navigate, next);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_VERIFIED') {
        navigate('/login', { replace: true, state: { next } });
        return;
      }
      setError(err.message);
      setCode('');
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const onChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(null);
    if (digits.length === 6) verify(digits);
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    try {
      const res = await api.resendOtp({ email, ...(role ? { role } : {}) });
      setCooldown(res.resendInSeconds ?? 60);
      setNotice('A new code is on its way.');
    } catch (err) {
      if (err instanceof ApiError && err.details?.retryAfterSeconds) setCooldown(err.details.retryAfterSeconds);
      setError(err.message);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <h1>Check your email</h1>
        <p className="auth-sub">
          We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) verify(code);
          }}
        >
          <label className="field">
            <span>Verification code</span>
            <input
              ref={inputRef}
              className="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={onChange}
              aria-invalid={Boolean(error)}
              disabled={submitting}
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="form-ok" role="status">{notice}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || code.length !== 6}>
            {submitting ? 'Checking…' : 'Verify and continue'}
          </button>
        </form>

        <p className="auth-alt">
          Didn&apos;t get it? Check spam, or{' '}
          <button type="button" className="link-btn" onClick={resend} disabled={cooldown > 0}>
            {cooldown > 0 ? `resend in ${cooldown}s` : 'send a new code'}
          </button>
        </p>
        <p className="auth-alt">
          Wrong email? <Link to="/signup" state={{ next }}>Start again</Link>
        </p>
      </div>
    </section>
  );
}
