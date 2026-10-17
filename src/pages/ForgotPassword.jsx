import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <section className="auth-wrap">
      <div className="auth-card">
        <h1>Reset your password</h1>
        {sent ? (
          <>
            <p className="auth-sub" role="status">
              If an account exists for <strong>{email.trim()}</strong>, we&apos;ve emailed a link to choose a new password. It works once and expires in an hour.
            </p>
            <p className="auth-alt">Nothing arrived? Check spam, or <button type="button" className="link-btn" onClick={() => setSent(false)}>try again</button>.</p>
          </>
        ) : (
          <>
            <p className="auth-sub">Enter the email you signed up with and we&apos;ll send you a link to choose a new password.</p>
            <form onSubmit={submit} noValidate>
              <label className="field">
                <span>Email</span>
                <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email.trim()}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
        <p className="auth-alt"><Link to="/login">Back to log in</Link></p>
      </div>
    </section>
  );
}
