import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import { fieldErrorsOf } from '../lib/forms.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldError(null);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && fieldErrorsOf(err).password) setFieldError(fieldErrorsOf(err).password);
      else setError(err.message);
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <section className="auth-wrap">
        <div className="auth-card">
          <h1>Password changed</h1>
          <p className="auth-sub" role="status">You&apos;ve been logged out everywhere. Log in with your new password.</p>
          <Link to="/login" className="btn btn-primary btn-block">Log in</Link>
        </div>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="auth-wrap">
        <div className="auth-card">
          <h1>Link not valid</h1>
          <p className="auth-sub">This reset link is incomplete. Request a new one.</p>
          <Link to="/forgot-password" className="btn btn-primary btn-block">Request a new link</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <h1>Choose a new password</h1>
        <p className="auth-sub">At least 8 characters, with a letter and a number.</p>
        <form onSubmit={submit} noValidate>
          <label className="field">
            <span>New password</span>
            <div className="pw">
              <input type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(fieldError)} required />
              <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
            </div>
            {fieldError && <small className="err">{fieldError}</small>}
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error} {error.includes('expired') && <Link to="/forgot-password">Request a new link</Link>}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !password}>
            {submitting ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </section>
  );
}
