import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { finishAuth } from '../lib/postAuth.js';
import { loadPending } from '../lib/pending.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, ready, setUser } = useAuth();
  const next = location.state?.next;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (ready && user) return <Navigate to="/app" replace />;
  const hasPending = Boolean(loadPending()?.result);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { user: loggedIn } = await api.login({ email: email.trim(), password });
      setUser(loggedIn);
      await finishAuth(loggedIn, navigate, next);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify', { state: { email: err.details?.email ?? email.trim(), resendIn: 60, next } });
        return;
      }
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-sub">
          {hasPending ? 'Log in to save your assessment and see your options.' : 'Log in to see your saved assessments.'}
        </p>

        <form onSubmit={submit} noValidate>
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="pw">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword((s) => !s)} aria-pressed={showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email || !password}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-alt">
          New to Sunledger? <Link to="/signup" state={location.state}>Create a free account</Link>
        </p>
      </div>
    </section>
  );
}
