import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { formatDate } from '../../lib/format.js';

const describe = (e) => {
  const d = e.detail ?? {};
  if (e.action === 'settings.update') return `Changed ${Object.keys(d).length} pricing setting(s): ${Object.entries(d).map(([k, v]) => `${k} ${v.from} → ${v.to}`).join('; ')}`;
  if (e.action === 'vendor.verification') return `${e.target}: ${d.from} → ${d.to}`;
  if (e.action === 'user.status') return `${e.target}: ${d.from} → ${d.to}`;
  return e.target;
};

export default function AdminActivity() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api.adminAudit().then((r) => setEntries(r.entries)).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="dash-h2">Activity</h2>
          <p className="muted">The last 50 changes made from this console.</p>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!entries && !error && <p className="muted" role="status">Loading…</p>}
      {entries?.length === 0 && <div className="empty-card"><h3>Nothing yet</h3><p>Changes you make here will be listed.</p></div>}
      <ul className="request-list">
        {(entries ?? []).map((e) => (
          <li key={e.id} className="request-card">
            <p><strong>{e.adminName ?? 'An admin'}</strong> · {formatDate(e.at)}</p>
            <p className="muted">{describe(e)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
