import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

// The logistics partner's page. They arrive from an email link, no login: one order, one button.
export default function Dispatch() {
  const [params] = useSearchParams();
  const t = params.get('t') ?? '';
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.dispatchInfo(t).then((r) => setJob(r.job)).catch((e) => setError(e.message)); }, [t]);

  const confirm = async () => {
    setBusy(true);
    try { await api.dispatchConfirm(t); setDone(true); } catch (e) { setError(e.message); }
    setBusy(false);
  };

  if (error) return <div className="wrap narrow"><h1>Link problem</h1><p className="form-error" role="alert">{error}</p></div>;
  if (!job) return <div className="wrap narrow"><p className="muted" role="status">Loading…</p></div>;
  const pick = job.action === 'pickup';

  return (
    <div className="wrap narrow dispatch">
      <p className="eyebrow">Sunledger logistics</p>
      <h1>Order {job.ref}</h1>
      <dl className="summary-list">
        <div><dt>Pick up from</dt><dd>{job.vendor}{job.from ? ` · ${job.from}` : ''}</dd></div>
        <div><dt>Deliver to</dt><dd>{job.to}</dd></div>
        <div><dt>Contact</dt><dd>{job.contact.name} · <a href={`tel:${job.contact.phone}`}>{job.contact.phone}</a></dd></div>
        <div><dt>Items</dt><dd>{job.items.join(', ')}</dd></div>
      </dl>
      {(done || job.done) ? <p className="notice">{pick ? 'Marked as picked up. Thank you.' : 'Marked as delivered. Thank you.'}</p>
        : <button type="button" className="btn btn-primary" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : pick ? 'I have picked it up' : 'I have delivered it'}</button>}
    </div>
  );
}
