import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '../api.js';
import AddressFields, { emptyAddress } from '../components/AddressFields.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { finishAuth } from '../lib/postAuth.js';
import { loadPending } from '../lib/pending.js';

const ROLES = [
  { key: 'individual', title: 'Individual', text: 'For my home' },
  { key: 'business', title: 'Business', text: 'For my company or organisation' },
  { key: 'vendor', title: 'Vendor', text: 'I install or supply solar and power equipment' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const initialRole = ROLES.some((r) => r.key === params.get('role')) ? params.get('role') : 'individual';

  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({ fullName: '', companyName: '', email: '', phone: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [emailTaken, setEmailTaken] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const needsCompany = role === 'business' || role === 'vendor';
  const hasPending = Boolean(loadPending()?.result) && role !== 'vendor';
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setEmailTaken(null);

    const body = {
      role,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      address: { line: address.line.trim(), state: address.state, areaId: address.areaId },
      ...(needsCompany ? { companyName: form.companyName.trim() } : {}),
    };

    try {
      const res = await api.register(body);
      if (res.added) {
        // They already had an account on this email, so no code is needed.
        setUser(res.user);
        await finishAuth(res.user, navigate, location.state?.next);
        return;
      }
      navigate('/verify', {
        state: { email: res.email, role: res.role, resendIn: res.resendInSeconds, next: location.state?.next },
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setFieldErrors(err.details?.fields ?? {});
      else if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') setEmailTaken(err.message);
      else if (err instanceof ApiError && err.code === 'EXISTING_ACCOUNT_PASSWORD') setFieldErrors({ password: err.message });
      else setFormError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="auth-card auth-card-wide">
        <h1>Create your free account</h1>
        <p className="auth-sub">
          {hasPending
            ? 'Your assessment is waiting. Sign up to save it and see how to switch.'
            : 'Save your results and get matched with vetted providers.'}
        </p>

        <form onSubmit={submit} noValidate>
          <fieldset className="role-grid">
            <legend className="field-legend">I am signing up as</legend>
            {ROLES.map((r) => (
              <label key={r.key} className={`choice choice-small${role === r.key ? ' on' : ''}`}>
                <input type="radio" name="role" checked={role === r.key} onChange={() => setRole(r.key)} />
                <strong>{r.title}</strong>
                <span>{r.text}</span>
              </label>
            ))}
          </fieldset>

          <label className="field">
            <span>Your full name</span>
            <input type="text" autoComplete="name" value={form.fullName} onChange={set('fullName')} aria-invalid={Boolean(fieldErrors.fullName)} required />
            {fieldErrors.fullName && <small className="err">{fieldErrors.fullName}</small>}
          </label>

          {needsCompany && (
            <label className="field">
              <span>{role === 'vendor' ? 'Company name' : 'Business or organisation name'}</span>
              <input type="text" autoComplete="organization" value={form.companyName} onChange={set('companyName')} aria-invalid={Boolean(fieldErrors.companyName)} required />
              {fieldErrors.companyName && <small className="err">{fieldErrors.companyName}</small>}
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(fieldErrors.email)} required />
            {fieldErrors.email ? <small className="err">{fieldErrors.email}</small> : <small>We&apos;ll send a 6-digit code to confirm it.</small>}
          </label>

          <label className="field">
            <span>Phone number</span>
            <input type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="0803 123 4567" aria-invalid={Boolean(fieldErrors.phone)} required />
            {fieldErrors.phone && <small className="err">{fieldErrors.phone}</small>}
          </label>

          <AddressFields
            value={address}
            onChange={setAddress}
            errors={fieldErrors}
            legend={role === 'vendor' ? 'Business location (where orders are picked up)' : 'Delivery address'}
          />
          <p className="muted small-note">Sunledger is live in Lagos and Abuja for now.</p>

          <label className="field">
            <span>Password</span>
            <div className="pw">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                aria-invalid={Boolean(fieldErrors.password)}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword((s) => !s)} aria-pressed={showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password ? <small className="err">{fieldErrors.password}</small> : <small>At least 8 characters, with a letter and a number. Already have a Sunledger account with this email? Use its password to add this account type.</small>}
          </label>

          {emailTaken && (
            <p className="form-error" role="alert">
              {emailTaken} <Link to="/login" state={location.state}>Log in instead</Link>.
            </p>
          )}
          {formError && <p className="form-error" role="alert">{formError}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link to="/login" state={location.state}>Log in</Link>
        </p>
      </div>
    </section>
  );
}
