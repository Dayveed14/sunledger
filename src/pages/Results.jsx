import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAssessment } from '../components/AssessmentContext.jsx';
import ResultsView from '../components/ResultsView.jsx';
import { clearPending, loadPending } from '../lib/pending.js';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open } = useAssessment();
  // location.key changes whenever the assessment is re-run, so we re-read the latest result.
  const pending = useMemo(() => loadPending(), [location.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!pending?.result) {
    return (
      <section className="wrap page-narrow empty-state">
        <h1>No assessment yet</h1>
        <p className="lede">It takes about three minutes and you don&apos;t need an account.</p>
        <button type="button" className="btn btn-primary" onClick={() => open()}>Run your free assessment</button>
      </section>
    );
  }

  const isCustomer = user && (user.role === 'individual' || user.role === 'business');

  // Saves the assessment, then opens it (or, if they tapped an option, that option's vendor offers).
  const save = async (plan) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.saveAssessment(pending.input);
      clearPending();
      navigate(plan ? `/app/assessments/${saved.id}/offers?plan=${plan}` : `/app/assessments/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="wrap results-page">
      <header className="results-head">
        <div>
          <p className="eyebrow">Your free assessment</p>
          <h1>Here&apos;s what your power really costs</h1>
        </div>
        <div className="results-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => open({ edit: true })}>
            Change my answers
          </button>
          {isCustomer ? (
            <button type="button" className="btn btn-primary btn-small" onClick={() => save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save to my account'}
            </button>
          ) : (
            !user && <Link to="/signup" className="btn btn-primary btn-small">Save these results</Link>
          )}
        </div>
      </header>

      {error && <p className="form-error" role="alert">{error}</p>}

      {!user && (
        <aside className="r-banner">
          <div>
            <strong>Want to act on this?</strong>
            <span>
              Create a free account to save your results and see how to switch by renting, leasing or paying monthly.
            </span>
          </div>
          <div className="r-banner-actions">
            <Link to="/signup" className="btn btn-primary btn-small">Create free account</Link>
            <Link to="/login" className="btn btn-ghost btn-small">I have an account</Link>
          </div>
        </aside>
      )}

      {user && !isCustomer && (
        <aside className="r-banner">
          <div><strong>You&apos;re signed in as a {user.role}.</strong><span>Assessments can be saved on individual and business accounts.</span></div>
        </aside>
      )}

      <ResultsView
        result={pending.result}
        mode={isCustomer ? 'saved' : 'guest'}
        onChoose={isCustomer ? (plan) => save(plan) : () => navigate('/signup')}
      />
      {isCustomer && (
        <p className="r-fine center">Tap an option to save this assessment and see offers from vendors.</p>
      )}
    </div>
  );
}
