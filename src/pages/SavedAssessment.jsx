import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAssessment } from '../components/AssessmentContext.jsx';
import ResultsView from '../components/ResultsView.jsx';
import { formatDate } from '../lib/format.js';

export default function SavedAssessment() {
  const { id } = useParams();
  const { user } = useAuth();
  const { open } = useAssessment();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, data: null, error: null });
    api
      .getAssessment(id)
      .then((data) => !cancelled && setState({ loading: false, data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.loading) return <div className="page-loading" role="status">Loading your assessment…</div>;
  if (state.error) {
    return (
      <section className="wrap page-narrow empty-state">
        <h1>We couldn&apos;t open that assessment</h1>
        <p className="lede">{state.error}</p>
        <Link to="/app" className="btn btn-primary">Back to dashboard</Link>
      </section>
    );
  }

  return (
    <div className="wrap results-page">
      <header className="results-head">
        <div>
          <p className="eyebrow">Saved assessment · {formatDate(state.data.createdAt)}</p>
          <h1>Your energy assessment</h1>
        </div>
        <div className="results-actions">
          <Link to="/app" className="btn btn-ghost btn-small">All assessments</Link>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => open({ segment: user?.role === 'business' ? 'business' : 'home' })}
          >
            New assessment
          </button>
        </div>
      </header>
      <ResultsView result={state.data.result} mode="saved" onChoose={(plan) => navigate(`/app/assessments/${id}/offers?plan=${plan}`)} />
    </div>
  );
}
