import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAssessment } from '../components/AssessmentContext.jsx';
import { formatDate, kwh, nairaCompact } from '../lib/format.js';
import { clearPending, loadPending } from '../lib/pending.js';

const ROLE_LABEL = { individual: 'Individual', business: 'Business', vendor: 'Vendor', admin: 'Admin' };

export default function Dashboard() {
  const { user } = useAuth();
  const { open } = useAssessment();
  const navigate = useNavigate();
  const isCustomer = user.role === 'individual' || user.role === 'business';

  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(() => loadPending());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isCustomer) return undefined;
    let cancelled = false;
    api
      .listAssessments()
      .then((r) => !cancelled && setItems(r.assessments))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

  const savePending = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.saveAssessment(pending.input);
      clearPending();
      setPending(null);
      navigate(`/app/assessments/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const firstName = user.fullName.split(' ')[0];
  const newAssessment = () => open({ segment: user.role === 'business' ? 'business' : 'home' });

  return (
    <div className="wrap dash">
      <header className="dash-head">
        <div>
          <p className="eyebrow">{ROLE_LABEL[user.role]} account{user.companyName ? ` · ${user.companyName}` : ''}</p>
          <h1>Welcome, {firstName}</h1>
        </div>
        {isCustomer && (
          <button type="button" className="btn btn-primary" onClick={newAssessment}>New assessment</button>
        )}
      </header>

      {error && <p className="form-error" role="alert">{error}</p>}

      {isCustomer && pending?.result && (
        <aside className="r-banner">
          <div>
            <strong>You have an assessment that isn&apos;t saved yet.</strong>
            <span>It&apos;s from this browser session. Save it to keep it.</span>
          </div>
          <div className="r-banner-actions">
            <button type="button" className="btn btn-primary btn-small" onClick={savePending} disabled={saving}>
              {saving ? 'Saving…' : 'Save it'}
            </button>
          </div>
        </aside>
      )}

      {isCustomer && (
        <section aria-labelledby="dash-list">
          <h2 id="dash-list" className="dash-h2">Your assessments</h2>
          {items === null && !error && <p className="muted" role="status">Loading…</p>}
          {items?.length === 0 && (
            <div className="empty-card">
              <h3>No assessments yet</h3>
              <p>Tick what you use and we&apos;ll work out what your power costs and what solar could save you.</p>
              <button type="button" className="btn btn-primary" onClick={newAssessment}>Start your first assessment</button>
            </div>
          )}
          {items?.length > 0 && (
            <ul className="a-list">
              {items.map((a) => (
                <li key={a.id}>
                  <Link to={`/app/assessments/${a.id}`} className="a-row">
                    <div className="a-main">
                      <strong>{a.segment === 'business' ? 'Business' : 'Home'} assessment</strong>
                      <small>{formatDate(a.createdAt)}{a.supplyBand ? ` · Band ${a.supplyBand}` : ''}</small>
                    </div>
                    <div className="a-stat"><span>Uses</span><strong>{kwh(a.kwhPerDay)} kWh/day</strong></div>
                    <div className="a-stat"><span>Generator cost</span><strong>{nairaCompact(a.generatorMonthlyCost)}/mo</strong></div>
                    <div className="a-stat"><span>Solar system</span><strong>{nairaCompact(a.solarSystemCost)}</strong></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {user.role === 'vendor' && (
        <section className="empty-card">
          <h3>Your vendor account is ready</h3>
          <p>
            The marketplace opens in the next phase. We&apos;ll email <strong>{user.email}</strong> when you can list your
            services, receive quote requests and be matched with customers.
          </p>
        </section>
      )}

      {user.role === 'admin' && (
        <section className="empty-card">
          <h3>Admin console</h3>
          <p>Vendor verification and user management arrive in a later phase.</p>
        </section>
      )}
    </div>
  );
}
